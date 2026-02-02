import { useState, useMemo } from "react"
import { useAccount } from "wagmi"
import { WalletConnectGuard } from "@/components/WalletConnectGuard"
import { PageHeader } from "@/components/PageHeader"
import { Tooltip, TooltipIcon } from "@/components/Tooltip"
import { StakingChoiceModal } from "../../components/StakingChoiceModal/StakingChoiceModal"
import { ATPStakingCardList } from "../../components/ATPStakingCardList"
import { ATPStakingOverview } from "@/components/ATPStakingOverview"
import { WalletStakesDetailsModal } from "@/components/WalletStakesDetailsModal/WalletStakesDetailsModal"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { calculateStakeableAmount } from "@/hooks/atp/useStakeableAmount"
import { formatUnits } from "viem"
import type { ATPData } from "@/hooks/atp/atpTypes"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useERC20Balance } from "@/hooks/erc20"
import { useActivationThresholdFormatted } from "@/hooks/rollup/useActivationThresholdFormatted"
import { useATP } from "@/hooks/useATP"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"

/**
 * My Position page for ATP (Aztec Token Positions)
 * Displays user's ATP holdings and staking options
 */
export default function MyPositionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAtp, setSelectedAtp] = useState<ATPData | null>(null)
  const [isWalletStakesModalOpen, setIsWalletStakesModalOpen] = useState(false)

  const { address } = useAccount()
  const { stakingAssetAddress, symbol, decimals, isLoading: isLoadingTokenDetails } =
    useStakingAssetTokenDetails()
  const { balance, isLoading: isBalanceLoading } = useERC20Balance(
    stakingAssetAddress,
    address
  )
  // Combined loading state - only show loading when actually fetching data
  const isWalletDataLoading = isLoadingTokenDetails || (!!stakingAssetAddress && isBalanceLoading)
  const { activationThreshold, formattedThreshold } =
    useActivationThresholdFormatted()
  const { atpData } = useATP()
  const { totalErc20Staked, directStakeBreakdown, delegationBreakdown, erc20DelegationBreakdown, erc20DirectStakeBreakdown, refetch } = useAggregatedStakingData()

  // Check if user has any staked positions (ATP vaults or ERC20 wallet stakes)
  const hasStakedPositions =
    directStakeBreakdown.length > 0 ||
    delegationBreakdown.length > 0 ||
    erc20DelegationBreakdown.length > 0 ||
    erc20DirectStakeBreakdown.length > 0

  // Calculate stakeable amount (rounded down to nearest activation threshold multiple)
  const walletStakeableAmount = useMemo(() => {
    if (!balance || !activationThreshold) return 0n
    return calculateStakeableAmount(balance, activationThreshold)
  }, [balance, activationThreshold])

  const canStake =
    balance && activationThreshold && balance >= activationThreshold

  // Calculate staked/available percentages for progress bar
  const { stakedPercent, availablePercent } = useMemo(() => {
    const staked = totalErc20Staked || 0n
    const available = balance || 0n
    const total = staked + available

    if (total === 0n) {
      return { stakedPercent: 0, availablePercent: 0 }
    }

    const stakedPct = Number((staked * 100n) / total)
    const availablePct = 100 - stakedPct

    return { stakedPercent: stakedPct, availablePercent: availablePct }
  }, [totalErc20Staked, balance])


  const handleStakeClick = (atp: ATPData) => {
    setSelectedAtp(atp)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAtp(null)
  }

  return (
    <>
      {/* Positions Overview Section - only show if user has staked positions */}
      {hasStakedPositions && (
        <div className="pb-6 mb-6 border-b border-parchment/20">
          <PageHeader
            title="Positions Overview"
            description="Overview of your staked positions and claimable rewards."
            tooltip="A summary of all your staking positions across Wallet and Token Vaults"
          />
          <ATPStakingOverview atpData={atpData || []} walletBalance={balance} />
        </div>
      )}

      {/* Token Balance Section */}
      <div className="pb-6 mb-6 border-b border-parchment/20">
        <PageHeader
          title="Wallet Balance"
          description={`${symbol || 'AZTEC'} tokens in your connected wallet.`}
        />

        <div className="flex items-center justify-between mb-3">
          {/* Staked balance */}
          <div className="flex items-end gap-4">
            <div>
              <div className="text-xs font-oracle-standard text-parchment/50 uppercase tracking-wide mb-1">
                Staked
              </div>
              <div className="font-mono text-xl font-bold text-parchment">
                {isWalletDataLoading
                  ? "Loading..."
                  : formatTokenAmount(
                      totalErc20Staked || 0n,
                      decimals,
                      symbol || "AZTEC"
                    )}
              </div>
            </div>

            {/* Withdraw button */}
            {totalErc20Staked && totalErc20Staked > 0n ? (
              <button
                onClick={() => setIsWalletStakesModalOpen(true)}
                className="font-oracle-standard font-bold text-sm uppercase tracking-wider px-4 py-2 transition-all border border-parchment/40 text-parchment hover:bg-parchment/10"
              >
                Manage
              </button>
            ) : null}
          </div>

          {/* Unstaked balance + Stake button */}
          <div className="flex items-end gap-4">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-oracle-standard text-parchment/50 uppercase tracking-wide mb-1 text-right">
                <span>Available to stake</span>
                <TooltipIcon
                  content={`Rounded down to valid stake amounts (multiples of ${formattedThreshold || 'minimum stake'}).${balance && decimals !== undefined ? ` Exact balance: ${formatUnits(balance, decimals)} ${symbol || 'AZTEC'}` : ''}`}
                  size="sm"
                  position="top"
                />
              </div>
              <div className="font-mono text-xl font-bold text-chartreuse">
                {isWalletDataLoading
                  ? "Loading..."
                  : formatTokenAmount(
                      walletStakeableAmount,
                      decimals,
                      symbol || "AZTEC"
                    )}
              </div>
            </div>

            {/* Stake button */}
            {!canStake ? (
              <Tooltip
                content={`Minimum ${formattedThreshold} required to stake. Your balance is insufficient.`}
                position="top"
                maxWidth="max-w-xs"
              >
                <button
                  disabled
                  className="font-oracle-standard font-bold text-sm uppercase tracking-wider px-4 py-2 transition-all bg-parchment/20 text-parchment/40 cursor-not-allowed"
                >
                  Stake
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="font-oracle-standard font-bold text-sm uppercase tracking-wider px-4 py-2 transition-all bg-chartreuse text-ink hover:bg-chartreuse/90"
              >
                Stake
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex h-6 overflow-hidden border border-parchment/20 bg-parchment/5">
          {/* Staked portion */}
          {stakedPercent > 0 && (
            <div
              className="bg-parchment/30 relative flex items-center justify-center"
              style={{ width: `${stakedPercent}%` }}
            >
              <span className="text-xs font-oracle-standard font-bold text-parchment">
                {stakedPercent}%
              </span>
            </div>
          )}
          {/* Available portion */}
          {availablePercent > 0 && (
            <div
              className="bg-chartreuse relative flex items-center justify-center"
              style={{ width: `${availablePercent}%` }}
            >
              <span className="text-xs font-oracle-standard font-bold text-ink">
                {availablePercent}%
              </span>
            </div>
          )}
        </div>
      </div>

      <PageHeader
        title="Token Vaults"
        description="Token Vaults are a representation of your token holdings."
        tooltip="Token Vaults are tokenized representations of your staking positions with specific lock-up periods."
      />

      <WalletConnectGuard
        title="Connect Your Wallet"
        description="Connect your wallet to view your Token Vaults and manage your staking positions on the Aztec network."
        helpText="After connecting, you'll be able to view your Token Vaults, claim rewards, and manage your staking."
      >
        {/* ATP Staking Card List - Show actual ATP data or empty state */}
        <ATPStakingCardList onStakeClick={handleStakeClick} />

        {/* Staking Choice Modal */}
        <StakingChoiceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedAtp={selectedAtp}
        />
      </WalletConnectGuard>

      {/* Wallet Stakes Details Modal */}
      <WalletStakesDetailsModal
        isOpen={isWalletStakesModalOpen}
        onClose={() => setIsWalletStakesModalOpen(false)}
        delegations={erc20DelegationBreakdown}
        directStakes={erc20DirectStakeBreakdown}
        onWithdrawSuccess={refetch}
      />
    </>
  )
}
