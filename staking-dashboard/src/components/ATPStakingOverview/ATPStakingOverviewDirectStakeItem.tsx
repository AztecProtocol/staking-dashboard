import { CopyButton } from "@/components/CopyButton"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { getValidatorDashboardValidatorUrl } from "@/utils/validatorDashboardUtils"
import { getExplorerTxUrl } from "@/utils/explorerUtils"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import type { ATPData } from "@/hooks/atp"
import type { DirectStakeBreakdown, Erc20DirectStakeBreakdown } from "@/hooks/atp/useAggregatedStakingData"

interface ATPStakingOverviewDirectStakeItemProps {
  stake: DirectStakeBreakdown | Erc20DirectStakeBreakdown
  atp?: ATPData
  decimals: number
  symbol: string
  variant?: 'tokenVault' | 'wallet'
  onATPClick?: (atp: ATPData) => void
  onWalletClick?: () => void
  onClaimClick?: (stake: DirectStakeBreakdown, atp: ATPData | undefined) => void
}

/**
 * Individual direct stake item
 */
export const ATPStakingOverviewDirectStakeItem = ({
  stake,
  atp,
  decimals,
  symbol,
  variant = 'tokenVault',
  onATPClick,
  onWalletClick,
  onClaimClick
}: ATPStakingOverviewDirectStakeItemProps) => {
  const { isRewardsClaimable } = useIsRewardsClaimable()
  const isWallet = variant === 'wallet'

  return (
    <div className="bg-parchment/5 border border-parchment/10 p-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isWallet ? (
              <span
                onClick={() => onWalletClick?.()}
                className="text-xs text-chartreuse hover:text-chartreuse/80 hover:underline transition-colors font-medium cursor-pointer"
              >
                Wallet Self Stake →
              </span>
            ) : (
              <span
                onClick={() => atp && onATPClick?.(atp)}
                className="text-xs text-chartreuse hover:text-chartreuse/80 hover:underline transition-colors font-medium cursor-pointer"
              >
                Token Vault #{atp?.sequentialNumber || '?'} →
              </span>
            )}
            {stake.hasFailedDeposit && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-vermillion/10 border border-vermillion/30 rounded-sm">
                <Icon name="warning" size="sm" className="text-vermillion" />
                <span className="text-xs font-oracle-standard font-bold text-vermillion uppercase tracking-wide">Failed</span>
                <TooltipIcon
                  content={stake.failureReason
                    ? `Deposit failed: ${stake.failureReason}. Failed deposit funds are automatically sent back to staker contract, check the ATP details on how to get it back to token vault.`
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
              Sequencer: {stake.attesterAddress.slice(0, 10)}...{stake.attesterAddress.slice(-8)}
            </div>
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
          {stake.hasFailedDeposit && stake.failedDepositTxHash && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-vermillion/70">Failed TX:</span>
              <span className="font-mono text-xs text-vermillion">
                {stake.failedDepositTxHash.slice(0, 8)}...{stake.failedDepositTxHash.slice(-6)}
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
          )}
        </div>
        <div className="flex items-start gap-4">
          <div className="text-left sm:text-right">
            <div className="text-xs text-parchment/60 mb-0.5">Staked</div>
            <div className="font-mono text-xs font-bold text-parchment">
              {stake.hasFailedDeposit ? formatTokenAmount(0n, decimals, symbol) : formatTokenAmount(stake.stakedAmount, decimals, symbol)}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-parchment/60 mb-0.5">Rewards</div>
            {isWallet || stake.hasFailedDeposit ? (
              <div className="text-xs text-parchment/40">—</div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onClaimClick?.(stake as DirectStakeBreakdown, atp)}
                  disabled={isRewardsClaimable === false}
                  className="px-2 py-0.5 border font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-parchment/10 disabled:border-parchment/30 disabled:text-parchment/60 border-chartreuse bg-chartreuse text-ink hover:bg-chartreuse/90"
                  title={isRewardsClaimable === false ? "Rewards are currently locked by the network protocol" : "Claim self-stake rewards"}
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
