import { forwardRef } from "react"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import { formatTokenAmount, formatTokenAmountFull } from "@/utils/atpFormatters"

interface ATPStakingOverviewTotalStakedProps {
  totalStaked: bigint
  totalDirectStaked: bigint
  totalDelegated: bigint
  isExpanded: boolean
  onToggle: () => void
  decimals: number
  symbol: string
}

/**
 * Displays total staked amount with breakdown of direct stake and delegation
 */
export const ATPStakingOverviewTotalStaked = forwardRef<HTMLDivElement, ATPStakingOverviewTotalStakedProps>(
  ({ totalStaked, totalDirectStaked, totalDelegated, isExpanded, onToggle, decimals, symbol }, ref) => {
    // Calculate percentages
    const directPercent = totalStaked > 0n ? (Number(totalDirectStaked) / Number(totalStaked)) * 100 : 0
    const delegatedPercent = totalStaked > 0n ? (Number(totalDelegated) / Number(totalStaked)) * 100 : 0

    return (
      <div ref={ref} className="relative border border-parchment/20 p-4 hover:border-parchment/30 transition-colors">
        <button
          onClick={onToggle}
          className="w-full flex items-start justify-between"
        >
          <div className="text-left w-full">
            <div className="flex items-center gap-1 mb-1">
              <Icon name="lock" size="md" className="flex-shrink-0 text-parchment/60" />
              <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Total Staked</div>
              <TooltipIcon
                content="Total amount of tokens actively staked across all your Token Vaults, including both self-operated sequencers and delegations."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
            <div className="font-mono text-2xl font-bold text-chartreuse mb-3">
              {formatTokenAmountFull(totalStaked, decimals, symbol)}
            </div>

            {/* Visualization */}
            <div className="space-y-2">
              <div className="flex h-6 overflow-hidden border border-parchment/20 bg-parchment/5">
                {totalStaked > 0n ? (
                  <>
                    {/* Self Stake */}
                    {totalDirectStaked > 0n && (
                      <div
                        className="bg-chartreuse relative flex items-center justify-center"
                        style={{ width: `${directPercent}%` }}
                      >
                        {directPercent > 15 && (
                          <span className="text-xs font-oracle-standard font-bold text-ink">
                            {directPercent.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                    {/* Delegation */}
                    {totalDelegated > 0n && (
                      <div
                        className="bg-aqua relative flex items-center justify-center"
                        style={{ width: `${delegatedPercent}%` }}
                      >
                        {delegatedPercent > 15 && (
                          <span className="text-xs font-oracle-standard font-bold text-ink">
                            {delegatedPercent.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-chartreuse flex-shrink-0"></div>
                  <span className="text-parchment/70 font-oracle-standard text-[10px]">Self Stake</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-aqua flex-shrink-0"></div>
                  <span className="text-parchment/70 font-oracle-standard text-[10px]">Delegation</span>
                </div>
              </div>
            </div>
          </div>
          <Icon
            name="chevronDown"
            size="lg"
            className={`text-parchment/60 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-ink border border-parchment/20 p-4 space-y-4 z-10 shadow-lg">
            <div>
              <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Self Stake</div>
              <div className="font-mono text-base font-bold text-parchment">
                {formatTokenAmount(totalDirectStaked, decimals, symbol)}
              </div>
              <div className="text-xs text-parchment/50 mt-1">
                {totalStaked > 0n ? ((Number(totalDirectStaked * 10000n / totalStaked) / 100).toFixed(1)) : '0'}% of total
              </div>
            </div>
            <div>
              <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Delegation</div>
              <div className="font-mono text-base font-bold text-parchment">
                {formatTokenAmount(totalDelegated, decimals, symbol)}
              </div>
              <div className="text-xs text-parchment/50 mt-1">
                {totalStaked > 0n ? ((Number(totalDelegated * 10000n / totalStaked) / 100).toFixed(1)) : '0'}% of total
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ATPStakingOverviewTotalStaked.displayName = 'ATPStakingOverviewTotalStaked'
