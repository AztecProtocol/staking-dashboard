import { useState } from "react"
import type { Address } from "viem"
import { useAccount } from "wagmi"
import { CopyButton } from "@/components/CopyButton"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { StatusBadge } from "@/components/StatusBadge"
import { StakeHealthBar } from "@/components/StakeHealthBar"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { formatBipsToPercentage } from "@/utils/formatNumber"
import { formatBlockTimestamp } from "@/utils/dateFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { getValidatorDashboardValidatorUrl } from "@/utils/validatorDashboardUtils"
import { getExplorerTxUrl, getExplorerAddressUrl } from "@/utils/explorerUtils"
import { useSequencerStatus, SequencerStatus, useStakeHealth, useIsRewardsClaimable } from "@/hooks/rollup"
import { useGovernanceConfig } from "@/hooks/governance"
import { useClaimAllContext } from "@/contexts/ClaimAllContext"
import { WalletWithdrawalActions } from "./WalletWithdrawalActions"
import type { Erc20DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"

interface WalletDelegationItemProps {
  delegation: Erc20DelegationBreakdown
  onClaimClick: (delegation: {
    splitContract: Address
    providerName: string | null
    providerTakeRate: number
    providerRewardsRecipient: Address
  }) => void
  onWithdrawSuccess?: () => void
}

/**
 * Individual wallet delegation item component
 * Displays provider info, sequencer address, split contract, rewards, and withdrawal actions
 */
export const WalletDelegationItem = ({
  delegation,
  onClaimClick,
  onWithdrawSuccess
}: WalletDelegationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { address } = useAccount()
  const { symbol, decimals } = useStakingAssetTokenDetails()
  const { date, time } = formatBlockTimestamp(delegation.timestamp)
  const { getSplitStatus, claimAllHook } = useClaimAllContext()
  const { isRewardsClaimable } = useIsRewardsClaimable()

  const { status, statusLabel, isLoading: isLoadingStatus, canFinalize, actualUnlockTime, refetch: refetchStatus } = useSequencerStatus(delegation.attesterAddress as Address)
  const { withdrawalDelayDays } = useGovernanceConfig()

  const {
    effectiveBalance,
    activationThreshold,
    ejectionThreshold,
    healthPercentage,
    slashCount,
    isAtRisk,
    isCritical,
    isLoading: isLoadingHealth
  } = useStakeHealth(delegation.attesterAddress as Address)

  const splitStatus = getSplitStatus(delegation.splitContract as Address)
  const isInBatch = splitStatus !== 'idle'
  const isProcessingInBatch = splitStatus === 'processing'

  const isUnstaked = delegation.status === 'UNSTAKED'
  const isInQueue = status === SequencerStatus.NONE && !delegation.hasFailedDeposit && !isUnstaked

  const getButtonText = () => {
    if (!isProcessingInBatch) return 'Claim Rewards'
    if (claimAllHook.completedMessage) return claimAllHook.completedMessage
    if (claimAllHook.skipMessage) return claimAllHook.skipMessage
    if (claimAllHook.currentStep === 'claiming') return 'Claiming'
    if (claimAllHook.currentStep === 'distributing') return 'Distributing'
    return 'Withdrawing'
  }

  return (
    <div className="bg-parchment/5 border border-parchment/20 hover:border-chartreuse/40 transition-all">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-parchment/8 transition-all cursor-pointer group text-left"
      >
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              {delegation.providerLogo && (
                <img
                  src={delegation.providerLogo}
                  alt={delegation.providerName || `Provider ${delegation.providerId}`}
                  className="w-5 h-5 rounded object-cover flex-shrink-0"
                />
              )}
              <span className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
                {delegation.providerName || `Provider #${delegation.providerId}`}
              </span>
              {delegation.hasFailedDeposit && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-vermillion/10 border border-vermillion/30 rounded-sm">
                  <Icon name="warning" size="sm" className="text-vermillion" />
                  <span className="text-xs font-oracle-standard font-bold text-vermillion uppercase tracking-wide">Failed Deposit</span>
                </div>
              )}
              {!delegation.hasFailedDeposit && (
                <StatusBadge
                  status={status}
                  statusLabel={statusLabel}
                  isLoading={isLoadingStatus}
                  isUnstaked={isUnstaked}
                  isInQueue={isInQueue}
                  slashCount={slashCount}
                  isAtRisk={isAtRisk}
                />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-parchment/60">
              <Icon name="calendar" size="sm" className="text-parchment/60" />
              <span className="font-mono text-parchment/80">{date}</span>
              <Icon name="clock" size="sm" className="text-parchment/60 ml-2" />
              <span className="font-mono text-parchment/80">{time}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-parchment/60 mb-1">Staked</div>
              <div className="font-mono text-sm font-bold text-parchment">
                {delegation.hasFailedDeposit ? formatTokenAmount(0n, decimals, symbol) : formatTokenAmount(delegation.stakedAmount, decimals, symbol)}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-parchment/60 mb-1">Rewards</div>
              {!delegation.hasFailedDeposit ? (
                <div className="font-mono text-sm font-bold text-chartreuse">
                  {formatTokenAmount(delegation.rewards, decimals, symbol)}
                </div>
              ) : (
                <div className="text-sm text-parchment/40">—</div>
              )}
            </div>
          </div>
        </div>
        <div className="ml-6 flex-shrink-0">
          <Icon
            name="chevronDown"
            size="lg"
            className={`text-parchment/40 group-hover:text-chartreuse transition-all ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-4 border-t border-parchment/10">
          <div className="grid grid-cols-1 gap-3">
            {delegation.hasFailedDeposit ? (
              <>
                {delegation.failedDepositTxHash && (
                  <div className="bg-vermillion/10 border border-vermillion/30 p-3 rounded-sm">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" size="md" className="text-vermillion flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-oracle-standard font-bold text-vermillion uppercase tracking-wide mb-1">
                          Failed Deposit Detected
                        </div>
                        <div className="text-xs text-vermillion/80 mb-2">
                          {delegation.failureReason
                            ? `Deposit failed: ${delegation.failureReason}. Your tokens should be returned to your wallet.`
                            : "Deposit failed. Your tokens should be returned to your wallet."
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-vermillion/70">Failed TX:</span>
                          <span className="font-mono text-xs text-vermillion">
                            {delegation.failedDepositTxHash.slice(0, 10)}...{delegation.failedDepositTxHash.slice(-8)}
                          </span>
                          <CopyButton text={delegation.failedDepositTxHash} size="sm" />
                          <a
                            href={getExplorerTxUrl(delegation.failedDepositTxHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-vermillion/70 hover:text-vermillion transition-colors"
                            title="View failed transaction"
                          >
                            <Icon name="externalLink" size="sm" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Sequencer Address, Transaction & Split Contract */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <div className="min-h-0">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="text-xs text-parchment/60 uppercase tracking-wide">Sequencer Address</div>
                      <TooltipIcon
                        content="The sequencer address operated by this provider."
                        size="sm"
                        maxWidth="max-w-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-mono text-xs text-parchment">
                        {delegation.attesterAddress.slice(0, 10)}...{delegation.attesterAddress.slice(-8)}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CopyButton text={delegation.attesterAddress} size="sm" />
                        <a
                          href={getValidatorDashboardValidatorUrl(delegation.attesterAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-parchment/60 hover:text-chartreuse transition-colors"
                          title="View sequencer on dashboard"
                        >
                          <Icon name="externalLink" size="sm" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-0">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="text-xs text-parchment/60 uppercase tracking-wide">Delegation TX</div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-mono text-xs text-parchment">
                        {delegation.txHash.slice(0, 8)}...{delegation.txHash.slice(-6)}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CopyButton text={delegation.txHash} size="sm" />
                        <a
                          href={getExplorerTxUrl(delegation.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-parchment/60 hover:text-chartreuse transition-colors"
                          title="View on Etherscan"
                        >
                          <Icon name="externalLink" size="sm" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-0">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="text-xs text-parchment/60 uppercase tracking-wide">Split Contract</div>
                      <TooltipIcon
                        content="This contract acts as an escrow, holding rewards until you claim them."
                        size="sm"
                        maxWidth="max-w-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-mono text-xs text-parchment">
                        {delegation.splitContract.slice(0, 10)}...{delegation.splitContract.slice(-8)}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CopyButton text={delegation.splitContract} size="sm" />
                        <a
                          href={getExplorerAddressUrl(delegation.splitContract)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-parchment/60 hover:text-chartreuse transition-colors"
                          title="View on Etherscan"
                        >
                          <Icon name="externalLink" size="sm" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Take Rate */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <div className="text-xs text-parchment/60 uppercase tracking-wide">User Take Rate</div>
                    <TooltipIcon
                      content="Percentage of rewards you receive. This is calculated as 100% minus the provider's commission rate."
                      size="sm"
                      maxWidth="max-w-xs"
                    />
                  </div>
                  <div className="font-mono text-sm font-bold text-parchment">
                    {formatBipsToPercentage(10000 - delegation.providerTakeRate)}%
                  </div>
                </div>

                {/* ZOMBIE Status Explanation */}
                {status === SequencerStatus.ZOMBIE && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-sm">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" size="md" className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-oracle-standard font-bold text-yellow-500 uppercase tracking-wide mb-1">
                          Sequencer Ejected
                        </div>
                        <div className="text-xs text-yellow-500/80 space-y-1">
                          <p>This sequencer was removed from the active set because its effective balance dropped below the ejection threshold.</p>
                          <p>To recover your remaining stake:</p>
                          <ol className="list-decimal ml-4 space-y-0.5">
                            <li>Click "Initiate Unstake" below to begin the withdrawal process</li>
                            <li>Wait for the exit delay period to complete</li>
                            <li>Click "Finalize Withdraw" to receive funds back in your wallet</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stake Health Bar - shown only for validating sequencers */}
                {status === SequencerStatus.VALIDATING && (
                  <div className="pt-3 border-t border-parchment/10">
                    <StakeHealthBar
                      effectiveBalance={effectiveBalance}
                      activationThreshold={activationThreshold}
                      ejectionThreshold={ejectionThreshold}
                      healthPercentage={healthPercentage}
                      slashCount={slashCount}
                      isAtRisk={isAtRisk}
                      isCritical={isCritical}
                      isLoading={isLoadingHealth}
                    />
                  </div>
                )}

                {/* Claim Rewards - hidden for withdrawn delegations */}
                {!isUnstaked && (
                  <div className="pt-3 border-t border-parchment/10">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="text-xs text-parchment/60 uppercase tracking-wide">Rewards</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onClaimClick({
                          splitContract: delegation.splitContract,
                          providerName: delegation.providerName ?? null,
                          providerTakeRate: delegation.providerTakeRate,
                          providerRewardsRecipient: delegation.providerRewardsRecipient
                        })}
                        disabled={delegation.rewards === 0n || isInBatch || isRewardsClaimable === false}
                        className="px-3 py-1.5 border font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-parchment/10 disabled:border-parchment/30 disabled:text-parchment/60 border-chartreuse bg-chartreuse text-ink hover:bg-chartreuse/90"
                        title={
                          isRewardsClaimable === false
                            ? "Rewards are currently locked by the network protocol"
                            : delegation.rewards === 0n
                              ? "No rewards to claim"
                              : isInBatch
                                ? "Processing in batch"
                                : "Claim delegation rewards"
                        }
                      >
                        {isProcessingInBatch ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border rounded-full border-ink/30 border-t-ink animate-spin"></div>
                            <span>{getButtonText()}</span>
                          </div>
                        ) : (
                          'Claim Rewards'
                        )}
                      </button>
                      {(delegation.rewards === 0n || isRewardsClaimable === false) && (
                        <TooltipIcon
                          content={
                            isRewardsClaimable === false
                              ? "All rewards are currently locked by the network protocol."
                              : "No rewards available to claim yet."
                          }
                          size="sm"
                          maxWidth="max-w-xs"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Withdraw and Unstake Actions - hidden for withdrawn delegations */}
                {!isUnstaked && address && (
                  <WalletWithdrawalActions
                    attesterAddress={delegation.attesterAddress as Address}
                    recipientAddress={address}
                    status={status}
                    canFinalize={canFinalize}
                    actualUnlockTime={actualUnlockTime}
                    withdrawalDelayDays={withdrawalDelayDays}
                    onSuccess={() => {
                      refetchStatus()
                      onWithdrawSuccess?.()
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
