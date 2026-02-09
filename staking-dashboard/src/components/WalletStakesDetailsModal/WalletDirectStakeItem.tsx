import { useState } from "react"
import type { Address } from "viem"
import { useAccount } from "wagmi"
import { CopyButton } from "@/components/CopyButton"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { StatusBadge } from "@/components/StatusBadge"
import { StakeHealthBar } from "@/components/StakeHealthBar"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { formatBlockTimestamp } from "@/utils/dateFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { getValidatorDashboardValidatorUrl } from "@/utils/validatorDashboardUtils"
import { getExplorerTxUrl } from "@/utils/explorerUtils"
import { useSequencerStatus, SequencerStatus, useStakeHealth } from "@/hooks/rollup"
import { useGovernanceConfig } from "@/hooks/governance"
import { WalletWithdrawalActions } from "./WalletWithdrawalActions"
import type { Erc20DirectStakeBreakdown } from "@/hooks/atp/useAggregatedStakingData"

interface WalletDirectStakeItemProps {
  stake: Erc20DirectStakeBreakdown
  onWithdrawSuccess?: () => void
}

/**
 * Individual wallet direct stake item component
 * Displays sequencer info, stake amount, and withdrawal actions
 */
export const WalletDirectStakeItem = ({
  stake,
  onWithdrawSuccess
}: WalletDirectStakeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { address } = useAccount()
  const { symbol, decimals } = useStakingAssetTokenDetails()
  const { date, time } = formatBlockTimestamp(stake.timestamp)

  const { status, statusLabel, isLoading: isLoadingStatus, canFinalize, actualUnlockTime, refetch: refetchStatus } = useSequencerStatus(stake.attesterAddress as Address)
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
  } = useStakeHealth(stake.attesterAddress as Address)

  const isUnstaked = stake.status === 'UNSTAKED'
  const isInQueue = status === SequencerStatus.NONE && !stake.hasFailedDeposit && !isUnstaked

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
              <Icon name="server" size="md" className="text-parchment/60 flex-shrink-0" />
              <span className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
                Self-Operated Sequencer
              </span>
              {stake.hasFailedDeposit && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-vermillion/10 border border-vermillion/30 rounded-sm">
                  <Icon name="warning" size="sm" className="text-vermillion" />
                  <span className="text-xs font-oracle-standard font-bold text-vermillion uppercase tracking-wide">Failed Deposit</span>
                </div>
              )}
              {!stake.hasFailedDeposit && (
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
                {stake.hasFailedDeposit ? formatTokenAmount(0n, decimals, symbol) : formatTokenAmount(stake.stakedAmount, decimals, symbol)}
              </div>
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
            {stake.hasFailedDeposit ? (
              <>
                {stake.failedDepositTxHash && (
                  <div className="bg-vermillion/10 border border-vermillion/30 p-3 rounded-sm">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" size="md" className="text-vermillion flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-oracle-standard font-bold text-vermillion uppercase tracking-wide mb-1">
                          Failed Deposit Detected
                        </div>
                        <div className="text-xs text-vermillion/80 mb-2">
                          {stake.failureReason
                            ? `Deposit failed: ${stake.failureReason}. Your tokens should be returned to your wallet.`
                            : "Deposit failed. Your tokens should be returned to your wallet."
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-vermillion/70">Failed TX:</span>
                          <span className="font-mono text-xs text-vermillion">
                            {stake.failedDepositTxHash.slice(0, 10)}...{stake.failedDepositTxHash.slice(-8)}
                          </span>
                          <CopyButton text={stake.failedDepositTxHash} size="sm" />
                          <a
                            href={getExplorerTxUrl(stake.failedDepositTxHash)}
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
                {/* Sequencer Address & Transaction */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <div className="min-h-0">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="text-xs text-parchment/60 uppercase tracking-wide">Sequencer Address</div>
                      <TooltipIcon
                        content="Your self-operated sequencer address on the network."
                        size="sm"
                        maxWidth="max-w-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-mono text-xs text-parchment">
                        {stake.attesterAddress.slice(0, 10)}...{stake.attesterAddress.slice(-8)}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CopyButton text={stake.attesterAddress} size="sm" />
                        <a
                          href={getValidatorDashboardValidatorUrl(stake.attesterAddress)}
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
                      <div className="text-xs text-parchment/60 uppercase tracking-wide">Stake TX</div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-mono text-xs text-parchment">
                        {stake.txHash.slice(0, 8)}...{stake.txHash.slice(-6)}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CopyButton text={stake.txHash} size="sm" />
                        <a
                          href={getExplorerTxUrl(stake.txHash)}
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

                {/* Withdraw and Unstake Actions - hidden for withdrawn stakes */}
                {!isUnstaked && address && (
                  <WalletWithdrawalActions
                    attesterAddress={stake.attesterAddress as Address}
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
