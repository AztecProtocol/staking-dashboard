import { useState, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useATPDetails } from "@/hooks/atp"
import { useMultipleStakeWithProviderRewards, useStakerBalance } from "@/hooks/staker"
import { useStakeableAmount } from "@/hooks/atp/useStakeableAmount"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useATP } from "@/hooks/useATP"
import { useUserGovernancePower } from "@/hooks/governance"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { Icon } from "@/components/Icon"
import { ATPDetailsHeader } from "./ATPDetailsHeader"
import { ATPDetailsSummary } from "./ATPDetailsSummary"
import { ATPDetailsStakerBalance } from "./ATPDetailsStakerBalance"
import { ATPDetailsTechnicalInfo } from "./ATPDetailsTechnicalInfo"
import { ATPDetailsDirectStakeItem } from "./ATPDetailsDirectStakeItem"
import { ATPDetailsDelegationItem } from "./ATPDetailsDelegationItem"
import { ATPDetailsLoadingState } from "./ATPDetailsLoadingState"
import { ATPDetailsErrorState } from "./ATPDetailsErrorState"
import { VestingGraph } from "@/components/VestingSchedule"
import { ClaimAllProvider } from "@/contexts/ClaimAllContext"
import { ClaimAllDelegationRewardsButton } from "@/components/ClaimAllDelegationRewardsButton"
import { ClaimDelegationRewardsModal, type DelegationModalData } from "@/components/ClaimDelegationRewardsModal"
import type { ATPData } from "@/hooks/atp"
import type { Address } from "viem"

interface ATPDetailsModalProps {
  atp: ATPData
  isOpen: boolean
  onClose: () => void
  onWithdrawSuccess?: () => void
  onRefetchAllowance?: () => void
  onUpgradeSuccess?: () => void
}

interface GenerateATPAlertsParams {
  atp: ATPData
  stakerBalance: bigint
  activationThreshold: bigint | undefined
  isStakeable: boolean
  stakeableAmount: bigint | undefined
  decimals: number
  symbol: string
  isFullyWithdrawn: boolean
}

interface ATPAlert {
  messages: string[]
  type: 'error' | 'info'
}

/**
 * Generate alert messages for ATP details modal
 */
const generateATPAlerts = ({
  atp,
  stakerBalance,
  activationThreshold,
  isStakeable,
  stakeableAmount,
  decimals,
  symbol,
  isFullyWithdrawn
}: GenerateATPAlertsParams): ATPAlert => {
  const messages: string[] = []
  let type: 'error' | 'info' = 'info'

  // Fully withdrawn - no other alerts needed
  if (isFullyWithdrawn) {
    messages.push('All tokens have been withdrawn from this Token Vault.')
    return { messages, type }
  }

  // Staker balance alert - show if there's balance in staker contract
  if (stakerBalance > 0n) {
    messages.push('Staker balance detected. Your staker contract contains funds from failed deposits, unstaked balance, or remaining slashed balance. Use the "Move to Vault" button in the Staker Balance section to transfer funds back to your Token Vault.')
    type = 'error'
  }

  // Staking status (only show if no staker balance, to avoid redundancy)
  if (stakerBalance === 0n && activationThreshold && !isStakeable) {
    const totalFunds = atp.allocation || 0n

    // Case 1: Total funds are less than activation threshold
    if (totalFunds < activationThreshold) {
      messages.push(`Your total funds (${formatTokenAmount(totalFunds, decimals, symbol)}) are less than the activation threshold (${formatTokenAmount(activationThreshold, decimals, symbol)}). Insufficient funds to stake from this Token Vault.`)
    }
    // Case 2: Total funds are sufficient but stakeable amount is not (tokens already staked)
    else if (stakeableAmount! < activationThreshold) {
      messages.push(`Minimum to stake is ${formatTokenAmount(activationThreshold, decimals, symbol)} (activation threshold). Your tokens are already staked or allocated.`)
    }
  }

  return { messages, type }
}

/**
 * Modal component for displaying detailed ATP information including staking and delegation data
 */
export const ATPDetailsModal = ({ atp, isOpen, onClose, onWithdrawSuccess, onRefetchAllowance, onUpgradeSuccess }: ATPDetailsModalProps) => {
  const [hideFailedDirectStakes, setHideFailedDirectStakes] = useState(true)
  const [hideFailedDelegations, setHideFailedDelegations] = useState(true)
  const [isDelegationClaimModalOpen, setIsDelegationClaimModalOpen] = useState(false)
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationModalData | null>(null)

  // Ref to track withdraw success timeout for cleanup
  const withdrawSuccessTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (withdrawSuccessTimeoutRef.current) {
        clearTimeout(withdrawSuccessTimeoutRef.current)
      }
    }
  }, [])

  const { data: atpDetails, isLoading: isLoadingDetails, error, refetch: refetchATPDetails } = useATPDetails(atp, isOpen)
  const { stakeableAmount, isStakeable, refetch: refetchStakeable } = useStakeableAmount(atp)
  const { activationThreshold, version: rollupVersion } = useRollupData()
  const { symbol, decimals } = useStakingAssetTokenDetails()
  const { balance: stakerBalance } = useStakerBalance({ stakerAddress: atp.staker })
  const { refetchAtpHoldings, refetchAtpData } = useATP()
  const { votingPower: governanceVotingPower, refetch: refetchGovernancePower } = useUserGovernancePower({
    stakerAddress: atp.staker
  })

  // Combined refetch handler for withdraw success - updates all relevant data sources
  const handleWithdrawSuccess = useCallback(() => {
    // Immediate refetches for blockchain data
    refetchStakeable()       // Refetch vault balance from blockchain (Available to Stake)
    refetchGovernancePower() // Refetch governance voting power
    onWithdrawSuccess?.()    // Notify parent to refetch stakeable amounts (Overview)
    onRefetchAllowance?.()   // Refetch allowance to update needsApproval state

    // Clear any existing timeout before setting a new one
    if (withdrawSuccessTimeoutRef.current) {
      clearTimeout(withdrawSuccessTimeoutRef.current)
    }

    // Delay refetch of indexer data to give indexer time to process the event
    withdrawSuccessTimeoutRef.current = setTimeout(() => {
      refetchATPDetails()    // Refetch indexer data (staking positions, delegations)
      refetchAtpHoldings()   // Refetch API data including totalWithdrawn (Total Funds)
      refetchAtpData()       // Refetch contract data
      onWithdrawSuccess?.()  // Also refetch after delay for updated data
      onRefetchAllowance?.() // Also refetch allowance after delay
    }, 3000)
  }, [refetchATPDetails, refetchStakeable, refetchGovernancePower, refetchAtpHoldings, refetchAtpData, onWithdrawSuccess, onRefetchAllowance])

  // Filter non-failed delegations for rewards calculation
  const nonFailedDelegations = atpDetails && (atpDetails.delegations).filter(d => !d.hasFailedDeposit) || []

  const {
    delegationRewards,
    totalUserRewards: totalDelegationRewards,
    isLoading: isLoadingDelegationRewards,
    refetch: refetchDelegationRewards
  } = useMultipleStakeWithProviderRewards({
    delegations: nonFailedDelegations,
    enabled: isOpen && !!atpDetails
  })

  if (!isOpen) return null

  // Show loading state while fetching details
  if (isLoadingDetails) {
    return createPortal(<ATPDetailsLoadingState onClose={onClose} />, document.body)
  }

  // Show error state if API call failed
  if (error) {
    return createPortal(<ATPDetailsErrorState onClose={onClose} />, document.body)
  }

  // Use API data if available, otherwise fallback to basic ATP data
  const stakingData = {
    totalStaked: atpDetails ? atpDetails.summary.totalStaked : 0n,
    delegationRewards: totalDelegationRewards
  }

  const directStakeData = atpDetails && atpDetails.directStakes || []
  const delegationData = atpDetails && atpDetails.delegations || []

  // Create a map of splitContract to delegation rewards for easy lookup
  const rewardsMap = new Map(
    nonFailedDelegations.map((delegation, index) => [
      delegation.splitContract,
      delegationRewards[index]
    ])
  )

  // Filter arrays based on individual toggles and staker balance
  // If no staker balance, hide all failed deposits (they've been dealt with)
  const filteredDirectStakes = (hideFailedDirectStakes || stakerBalance === 0n)
    ? directStakeData.filter(s => !s.hasFailedDeposit)
    : directStakeData

  const filteredDelegations = (hideFailedDelegations || stakerBalance === 0n)
    ? delegationData.filter(d => !d.hasFailedDeposit)
    : delegationData

  // Check if there are any failed deposits in each section
  const hasFailedDirectStakes = directStakeData.some(s => s.hasFailedDeposit)
  const hasFailedDelegations = delegationData.some(d => d.hasFailedDeposit)

  // Type-safe staker address extraction
  const stakerAddress = atp.staker

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDelegationClaimClick = (delegation: {
    splitContract: string
    providerName: string | null
    providerTakeRate: number
    providerRewardsRecipient: string
  }) => {
    setSelectedDelegation({
      splitContract: delegation.splitContract as Address,
      providerName: delegation.providerName,
      providerTakeRate: delegation.providerTakeRate,
      providerRewardsRecipient: delegation.providerRewardsRecipient as Address
    })
    setIsDelegationClaimModalOpen(true)
  }

  const handleCloseDelegationModal = () => {
    setIsDelegationClaimModalOpen(false)
    setSelectedDelegation(null)
  }

  // Calculate if fully withdrawn
  const totalWithdrawn = atp.totalWithdrawn || 0n
  const remainingAllocation = (atp.allocation || 0n) - totalWithdrawn
  const isFullyWithdrawn = remainingAllocation <= 0n && totalWithdrawn > 0n

  // Generate alert messages (only if required token details are available)
  const alertData = decimals !== undefined && symbol !== undefined
    ? generateATPAlerts({
        atp,
        stakerBalance,
        activationThreshold,
        isStakeable,
        stakeableAmount,
        decimals,
        symbol,
        isFullyWithdrawn
      })
    : { messages: [], type: 'info' as const }

  const { messages: alertMessages, type: alertType } = alertData

  return createPortal(
    <ClaimAllProvider>
      <div
        className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-16"
        onClick={handleBackdropClick}
      >
        <div className="bg-ink border border-parchment/20 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
          <div className="p-6 relative z-10">
            <ATPDetailsHeader atp={atp} onClose={onClose} />

            {/* Combined Alert Messages */}
            {alertMessages.length > 0 && (
              <div className={`flex items-start gap-2 mb-6 p-4 ${alertType === 'error'
                ? 'bg-vermillion/10 border border-vermillion/30 text-vermillion'
                : 'bg-aqua/10 border border-aqua/30 text-aqua'
                }`}>
                <Icon
                  name={alertType === 'error' ? 'warning' : 'info'}
                  size="md"
                  className="flex-shrink-0 mt-0.5"
                />
                <div className="text-sm space-y-2">
                  {alertMessages.map((message, index) => (
                    <div key={index}>{message}</div>
                  ))}
                </div>
              </div>
            )}

            <ATPDetailsSummary
              atp={atp}
              totalStaked={stakingData.totalStaked}
              delegationRewards={stakingData.delegationRewards}
              stakeableAmount={stakeableAmount}
              governancePower={governanceVotingPower.stakerPowers[0]?.power ?? 0n}
            />

            {/* Staker Balance - only show if balance > 0 */}
            {stakerAddress && stakerBalance > 0n && (
              <div className="mb-6">
                <ATPDetailsStakerBalance atp={atp} />
              </div>
            )}

            {/* Vesting Schedule - hide when fully withdrawn */}
            {atp.globalLock && !isFullyWithdrawn && (
              <div className="mb-6">
                <VestingGraph
                  globalLock={atp.globalLock}
                  atpType={atp.typeString}
                  registryAddress={atp.registry}
                />
              </div>
            )}

            <ATPDetailsTechnicalInfo atp={atp} onUpgradeSuccess={onUpgradeSuccess} />

            {/* Self Stake Breakdown */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
                    Self Stake {filteredDirectStakes.length > 0 && `(${filteredDirectStakes.length} item${filteredDirectStakes.length > 1 ? 's' : ''})`}
                  </h2>
                  {hasFailedDirectStakes && stakerBalance > 0n && (
                    <button
                      onClick={() => setHideFailedDirectStakes(!hideFailedDirectStakes)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-oracle-standard font-bold uppercase tracking-wide transition-all
                        ${hideFailedDirectStakes
                          ? 'bg-vermillion/10 border-vermillion/30 text-vermillion/60 hover:bg-vermillion/20 hover:border-vermillion/40'
                          : 'bg-parchment/10 border-parchment/30 text-parchment/60 hover:bg-parchment/20 hover:border-parchment/40'
                        }
                      `}
                      title={hideFailedDirectStakes ? 'Show failed deposits' : 'Hide failed deposits'}
                    >
                      <Icon name={hideFailedDirectStakes ? 'eye' : 'eyeOff'} size="sm" />
                      {hideFailedDirectStakes ? 'Show' : 'Hide'} Failed
                    </button>
                  )}
                </div>
              </div>
              {filteredDirectStakes.length > 0 ? (
                !stakerAddress ? (
                  <div className="bg-vermillion/10 border border-vermillion/30 p-4 text-center">
                    <div className="text-sm text-vermillion">
                      Error: Staker contract address not found
                    </div>
                  </div>
                ) : rollupVersion === undefined ? (
                  <div className="bg-parchment/5 border border-parchment/20 p-4 text-center">
                    <div className="text-sm text-parchment/60">
                      Loading stake details...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDirectStakes.map((stake, index) => (
                      <ATPDetailsDirectStakeItem
                        key={index}
                        stake={stake}
                        stakerAddress={stakerAddress}
                        rollupVersion={rollupVersion}
                        atp={atp}
                        onWithdrawSuccess={handleWithdrawSuccess}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-parchment/5 border border-parchment/20 p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="server" className="w-8 h-8 text-parchment/40" />
                    <div>
                      <div className="font-oracle-standard text-sm font-medium text-parchment/80 mb-1">
                        No Self Stakes
                      </div>
                      <div className="text-xs text-parchment/60">
                        This Token Vault has not been used for self staking (self-operated sequencer)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delegation */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
                    Delegation {filteredDelegations.length > 0 && `(${filteredDelegations.length} item${filteredDelegations.length > 1 ? 's' : ''})`}
                  </h2>
                  {hasFailedDelegations && stakerBalance > 0n && (
                    <button
                      onClick={() => setHideFailedDelegations(!hideFailedDelegations)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-oracle-standard font-bold uppercase tracking-wide transition-all 
                        ${hideFailedDelegations 
                          ? 'bg-vermillion/10 border-vermillion/30 text-vermillion/60 hover:bg-vermillion/20 hover:border-vermillion/40'
                          : 'bg-parchment/10 border-parchment/30 text-parchment/60 hover:bg-parchment/20 hover:border-parchment/40'
                        }
                      `}
                      title={hideFailedDelegations ? 'Show failed deposits' : 'Hide failed deposits'}
                    >
                      <Icon name={hideFailedDelegations ? 'eye' : 'eyeOff'} size="sm" />
                      {hideFailedDelegations ? 'Show' : 'Hide'} Failed
                    </button>
                  )}
                </div>
                {/* Claim All Button */}
                <ClaimAllDelegationRewardsButton
                  delegations={filteredDelegations
                    .filter(delegation => rewardsMap.has(delegation.splitContract))
                    .map(d => {
                      const rewards = rewardsMap.get(d.splitContract)
                      return {
                        splitContract: d.splitContract as Address,
                        providerTakeRate: d.providerTakeRate,
                        providerRewardsRecipient: d.providerRewardsRecipient as Address,
                        rewards: rewards?.userRewards ?? 0n
                      }
                    })}
                  onSuccess={refetchDelegationRewards}
                />
              </div>
              {filteredDelegations.length > 0 ? (
                !stakerAddress ? (
                  <div className="bg-vermillion/10 border border-vermillion/30 p-4 text-center">
                    <div className="text-sm text-vermillion">
                      Error: Staker contract address not found
                    </div>
                  </div>
                ) : rollupVersion === undefined ? (
                  <div className="bg-parchment/5 border border-parchment/20 p-4 text-center">
                    <div className="text-sm text-parchment/60">
                      Loading delegation details...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDelegations.map((delegation, index) => (
                      <ATPDetailsDelegationItem
                        key={index}
                        delegation={delegation}
                        delegationRewards={rewardsMap.get(delegation.splitContract) ?? {
                          splitContract: delegation.splitContract,
                          totalRewards: 0n,
                          userRewards: 0n,
                          takeRate: delegation.providerTakeRate
                        }}
                        isLoadingDelegationRewards={isLoadingDelegationRewards && !delegation.hasFailedDeposit}
                        stakerAddress={stakerAddress}
                        rollupVersion={rollupVersion}
                        onClaimClick={handleDelegationClaimClick}
                        onWithdrawSuccess={handleWithdrawSuccess}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-parchment/5 border border-parchment/20 p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="users" className="w-8 h-8 text-parchment/40" />
                    <div>
                      <div className="font-oracle-standard text-sm font-medium text-parchment/80 mb-1">
                        No Delegations
                      </div>
                      <div className="text-xs text-parchment/60">
                        This Token Vault has not been delegated to any staking providers
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Delegation Rewards Modal */}
      {selectedDelegation && (
        <ClaimDelegationRewardsModal
          isOpen={isDelegationClaimModalOpen}
          onClose={handleCloseDelegationModal}
          delegation={selectedDelegation}
          onSuccess={() => {
            refetchDelegationRewards()
            handleCloseDelegationModal()
          }}
        />
      )}
    </ClaimAllProvider>,
    document.body
  )
}