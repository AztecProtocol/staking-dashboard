import { CopyButton } from "@/components/CopyButton"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { getValidatorDashboardValidatorUrl } from "@/utils/validatorDashboardUtils"
import { getExplorerTxUrl } from "@/utils/explorerUtils"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import type { ATPData } from "@/hooks/atp"
import type { DelegationBreakdown, Erc20DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"

interface ATPStakingOverviewDelegationItemProps {
  delegation: DelegationBreakdown | Erc20DelegationBreakdown
  atp?: ATPData
  decimals: number
  symbol: string
  variant?: 'tokenVault' | 'wallet'
  onATPClick?: (atp: ATPData) => void
  onWalletClick?: () => void
  onClaimClick: (delegation: DelegationBreakdown | Erc20DelegationBreakdown) => void
}

/**
 * Individual delegation item with claim functionality
 */
export const ATPStakingOverviewDelegationItem = ({
  delegation,
  atp,
  decimals,
  symbol,
  variant = 'tokenVault',
  onATPClick,
  onWalletClick,
  onClaimClick
}: ATPStakingOverviewDelegationItemProps) => {
  const { isRewardsClaimable } = useIsRewardsClaimable()
  const isWallet = variant === 'wallet'

  return (
    <div className="glass p-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="flex items-center gap-1.5">
              {isWallet ? (
                <span
                  onClick={() => onWalletClick?.()}
                  className="text-xs text-accent hover:text-accent/80 hover:underline transition-colors font-medium cursor-pointer"
                >
                  Wallet Delegation →
                </span>
              ) : (
                <span
                  onClick={() => atp && onATPClick?.(atp)}
                  className="text-xs text-accent hover:text-accent/80 hover:underline transition-colors font-medium cursor-pointer"
                >
                  Token Vault #{atp?.sequentialNumber || '?'} →
                </span>
              )}
              {delegation.providerLogo && (
                <img
                  src={delegation.providerLogo}
                  alt={delegation.providerName || `Provider ${delegation.providerId}`}
                  className="w-4 h-4 rounded object-cover flex-shrink-0"
                />
              )}
              <span className="text-xs text-parchment/60">{delegation.providerName || `Provider #${delegation.providerId}`}</span>
            </div>
            {delegation.hasFailedDeposit && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-vermillion/10 border border-vermillion/30 rounded-sm">
                <Icon name="warning" size="sm" className="text-vermillion" />
                <span className="text-xs font-oracle-standard font-bold text-vermillion uppercase tracking-wide">Failed</span>
                <TooltipIcon
                  content={delegation.failureReason
                    ? `Deposit failed: ${delegation.failureReason}. Failed deposit funds are automatically sent back to staker contract, check the ATP details on how to get it back to token vault.`
                    : "Failed deposit funds are automatically sent back to staker contract, check the ATP details on how to get it back to token vault."
                  }
                  size="sm"
                  maxWidth="max-w-xs"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="font-mono text-xs text-parchment">
              Sequencer: {delegation.attesterAddress.slice(0, 10)}...{delegation.attesterAddress.slice(-8)}
            </div>
            <CopyButton text={delegation.attesterAddress} size="sm" />
            <a
              href={getValidatorDashboardValidatorUrl(delegation.attesterAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-parchment/60 hover:text-accent transition-colors"
              title="View sequencer on dashboard"
            >
              <Icon name="externalLink" size="sm" />
            </a>
          </div>
          {delegation.hasFailedDeposit && delegation.failedDepositTxHash && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-vermillion/70">Failed TX:</span>
              <span className="font-mono text-xs text-vermillion">
                {delegation.failedDepositTxHash.slice(0, 8)}...{delegation.failedDepositTxHash.slice(-6)}
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
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right">
            <div className="text-xs text-parchment/60 mb-0.5">Staked</div>
            <div className="font-mono text-xs font-bold text-parchment">
              {delegation.hasFailedDeposit ? formatTokenAmount(0n, decimals, symbol) : formatTokenAmount(delegation.stakedAmount, decimals, symbol)}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-parchment/60 mb-0.5">Rewards</div>
            {delegation.hasFailedDeposit ? (
              <div className="text-xs text-parchment/40">—</div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs font-bold text-accent">
                  {formatTokenAmount(delegation.rewards, decimals, symbol)}
                </div>
                <button
                  onClick={() => onClaimClick(delegation)}
                  disabled={delegation.rewards === 0n || isRewardsClaimable === false}
                  className="px-2 py-0.5 text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-parchment/10 disabled:border-parchment/30 disabled:text-parchment/60 btn-lime"
                  title={
                    isRewardsClaimable === false
                      ? "Rewards are currently locked by the network protocol"
                      : delegation.rewards === 0n
                        ? "No rewards to claim"
                        : "Claim delegation rewards"
                  }
                >
                  Claim
                </button>
                {isRewardsClaimable === false && (
                  <TooltipIcon
                    content="All rewards are currently locked by the network protocol. Claiming will be enabled once the protocol unlocks rewards."
                    size="sm"
                    maxWidth="max-w-xs"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
