import { useState, useEffect, useRef } from "react"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"
import { useMultipleStakeableAmounts } from "@/hooks/atp/useMultipleStakeableAmounts"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import { useCoinbaseAddresses, useMultipleCoinbaseRewards } from "@/hooks/rewards"
import { ATPDetailsModal } from "@/components/ATPDetailsModal"
import { ATPStakingOverviewSkeleton } from "./ATPStakingOverviewSkeleton"
import { ATPStakingOverviewTotalAllocation } from "./ATPStakingOverviewTotalAllocation"
import { ATPStakingOverviewTotalStaked } from "./ATPStakingOverviewTotalStaked"
import { ATPStakingOverviewStakeableAmount } from "./ATPStakingOverviewStakeableAmount"
import { ATPStakingOverviewClaimableRewards } from "./ATPStakingOverviewClaimableRewards"
import { ATPStakingOverviewBreakdownSection } from "./ATPStakingOverviewBreakdownSection"
import { ClaimAllProvider } from "@/contexts/ClaimAllContext"
import type { ATPData } from "@/hooks/atp"
import type { Address } from "viem"
import { calculateStakeableAmount } from "@/hooks/atp/useStakeableAmount"

interface ATPStakingOverviewProps {
  atpData: ATPData[]
  /** ERC20 wallet balance available to stake directly */
  walletBalance?: bigint
}

/**
 * Main component that displays ATP staking overview
 * Shows staked positions, stakeable amounts, and claimable rewards
 */
export const ATPStakingOverview = ({ atpData, walletBalance = 0n }: ATPStakingOverviewProps) => {
  const { symbol, decimals, isLoading: isLoadingTokenDetails } = useStakingAssetTokenDetails()

  const {
    totalStaked,
    totalDirectStaked,
    totalDelegated,
    totalErc20Staked,
    totalErc20Delegated,
    totalErc20DirectStaked,
    totalRewards,
    pendingWarehouseWithdrawal,
    directStakeBreakdown,
    delegationBreakdown,
    erc20DelegationBreakdown,
    erc20DirectStakeBreakdown,
    isLoading: isLoadingAggregated,
    refetch: refetchAggregatedData,
  } = useAggregatedStakingData()

  // Combined breakdown including both ATP and ERC20 wallet stakes
  // Note: totalStaked from API already includes ERC20, but the breakdown (direct/delegated) doesn't
  const combinedTotalDirectStaked = totalDirectStaked + totalErc20DirectStaked
  const combinedTotalDelegated = totalDelegated + totalErc20Delegated

  const {
    totalValidatorCount,
    totalStakeableAmount,
    activationThreshold,
    isLoading: isLoadingStakeable,
  } = useMultipleStakeableAmounts(atpData)

  // Check if rewards are claimable
  const { isRewardsClaimable } = useIsRewardsClaimable()

  // Get coinbase addresses and their rewards for self-stake tracking
  const { coinbaseAddresses } = useCoinbaseAddresses()
  const { totalCoinbaseRewards, coinbaseBreakdown, refetch: refetchCoinbaseRewards } = useMultipleCoinbaseRewards(coinbaseAddresses as Address[])

  // Calculate total allocation across all ATPs (accounting for withdrawals)
  const totalAtpAllocation = atpData.reduce((sum, atp) => {
    const remainingAllocation = (atp.allocation || 0n) - (atp.totalWithdrawn || 0n)
    return sum + (remainingAllocation > 0n ? remainingAllocation : 0n)
  }, 0n)

  // Total allocation = ATP allocations + ERC20 wallet balance + ERC20 staked
  // Note: walletBalance and totalErc20Staked are mutually exclusive (when tokens are staked,
  // they move FROM walletBalance TO totalErc20Staked), so there is no double-counting here.
  const totalAllocation = totalAtpAllocation + walletBalance + totalErc20Staked
  // Don't count claimable for fully withdrawn ATPs
  const totalAtpClaimable = atpData.reduce((sum, atp) => {
    const remainingAllocation = (atp.allocation || 0n) - (atp.totalWithdrawn || 0n)
    if (remainingAllocation <= 0n) return sum
    return sum + (atp.claimable || 0n)
  }, 0n)
  // Claimable/available includes ATP claimable + ERC20 wallet balance (available to use)
  const totalClaimable = totalAtpClaimable + walletBalance
  // Locked includes ATP locked (vesting) + ERC20 staked (in use)
  const totalLocked = (totalAtpAllocation - totalAtpClaimable) + totalErc20Staked

  // Collapsible state
  const [isTotalAllocationExpanded, setIsTotalAllocationExpanded] = useState(false)
  const [isTotalStakedExpanded, setIsTotalStakedExpanded] = useState(false)
  const [isTotalRewardsExpanded, setIsTotalRewardsExpanded] = useState(false)
  const [isStakeableExpanded, setIsStakeableExpanded] = useState(false)

  // Refs for click outside detection
  const totalAllocationRef = useRef<HTMLDivElement>(null)
  const totalStakedRef = useRef<HTMLDivElement>(null)
  const stakeableRef = useRef<HTMLDivElement>(null)
  const rewardsRef = useRef<HTMLDivElement>(null)

  // ATP Details Modal state
  const [selectedATP, setSelectedATP] = useState<ATPData | null>(null)

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (totalAllocationRef.current && !totalAllocationRef.current.contains(event.target as Node)) {
        setIsTotalAllocationExpanded(false)
      }
      if (totalStakedRef.current && !totalStakedRef.current.contains(event.target as Node)) {
        setIsTotalStakedExpanded(false)
      }
      if (stakeableRef.current && !stakeableRef.current.contains(event.target as Node)) {
        setIsStakeableExpanded(false)
      }
      if (rewardsRef.current && !rewardsRef.current.contains(event.target as Node)) {
        setIsTotalRewardsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Show skeleton while loading or if required data is missing
  if (isLoadingAggregated || isLoadingStakeable || isLoadingTokenDetails || decimals === undefined || symbol === undefined || activationThreshold === undefined) {
    return <ATPStakingOverviewSkeleton />
  }

  return (
    <ClaimAllProvider>
      <div className="relative bg-parchment/5 border border-parchment/20 p-8">
        {/* Total Allocation, Staked, Stakeable, and Rewards Row */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Total Allocation Section */}
            <ATPStakingOverviewTotalAllocation
              ref={totalAllocationRef}
              totalAllocation={totalAllocation}
              totalLocked={totalLocked}
              totalClaimable={totalClaimable}
              isExpanded={isTotalAllocationExpanded}
              onToggle={() => setIsTotalAllocationExpanded(!isTotalAllocationExpanded)}
              decimals={decimals}
              symbol={symbol}
            />

            {/* Total Staked Section */}
            <ATPStakingOverviewTotalStaked
              ref={totalStakedRef}
              totalStaked={totalStaked}
              totalDirectStaked={combinedTotalDirectStaked}
              totalDelegated={combinedTotalDelegated}
              isExpanded={isTotalStakedExpanded}
              onToggle={() => setIsTotalStakedExpanded(!isTotalStakedExpanded)}
              decimals={decimals}
              symbol={symbol}
            />

            {/* Stakeable Amount Section - includes ATP stakeable + ERC20 wallet balance (rounded) */}
            <ATPStakingOverviewStakeableAmount
              ref={stakeableRef}
              totalStakeableAmount={totalStakeableAmount + calculateStakeableAmount(walletBalance, activationThreshold)}
              totalStaked={totalStaked}
              totalValidatorCount={totalValidatorCount + (activationThreshold ? Number(walletBalance / activationThreshold) : 0)}
              activationThreshold={activationThreshold}
              isExpanded={isStakeableExpanded}
              onToggle={() => setIsStakeableExpanded(!isStakeableExpanded)}
              decimals={decimals}
              symbol={symbol}
            />

            {/* Total Rewards Section */}
            <ATPStakingOverviewClaimableRewards
              ref={rewardsRef}
              totalRewards={totalRewards}
              selfStakeRewards={totalCoinbaseRewards}
              pendingWarehouseWithdrawal={pendingWarehouseWithdrawal}
              isRewardsClaimable={isRewardsClaimable}
              isExpanded={isTotalRewardsExpanded}
              onToggle={() => setIsTotalRewardsExpanded(!isTotalRewardsExpanded)}
              decimals={decimals}
              symbol={symbol}
              delegationBreakdown={delegationBreakdown}
              coinbaseBreakdown={coinbaseBreakdown}
              onClaimSuccess={() => {
                refetchAggregatedData()
                refetchCoinbaseRewards()
              }}
            />
          </div>
        </div>

        {/* Breakdown Section - only show if there's actual data */}
        {(directStakeBreakdown.length > 0 || delegationBreakdown.length > 0 || erc20DelegationBreakdown.length > 0 || erc20DirectStakeBreakdown.length > 0) && (
          <ATPStakingOverviewBreakdownSection
            directStakeBreakdown={directStakeBreakdown}
            delegationBreakdown={delegationBreakdown}
            erc20DelegationBreakdown={erc20DelegationBreakdown}
            erc20DirectStakeBreakdown={erc20DirectStakeBreakdown}
            atpData={atpData}
            decimals={decimals}
            symbol={symbol}
            onATPClick={(atp) => setSelectedATP(atp)}
          />
        )}

        {/* ATP Details Modal */}
        {selectedATP && (
          <ATPDetailsModal
            atp={selectedATP}
            isOpen={!!selectedATP}
            onClose={() => setSelectedATP(null)}
          />
        )}
      </div>
    </ClaimAllProvider>
  )
}
