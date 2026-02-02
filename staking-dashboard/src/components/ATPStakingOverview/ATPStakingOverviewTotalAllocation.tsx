import { forwardRef } from "react"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import { formatTokenAmount, formatTokenAmountFull } from "@/utils/atpFormatters"

interface ATPStakingOverviewTotalAllocationProps {
  totalAllocation: bigint
  totalLocked: bigint
  totalClaimable: bigint
  isExpanded: boolean
  onToggle: () => void
  decimals: number
  symbol: string
}

/**
 * Displays total allocation across all Token Vaults
 */
export const ATPStakingOverviewTotalAllocation = forwardRef<HTMLDivElement, ATPStakingOverviewTotalAllocationProps>(
  ({ totalAllocation, totalLocked, totalClaimable, isExpanded, onToggle, decimals, symbol }, ref) => {

    // Calculate percentages based on total allocation
    const lockedPercent = totalAllocation > 0n ? (Number(totalLocked) / Number(totalAllocation)) * 100 : 0
    const claimablePercent = totalAllocation > 0n ? (Number(totalClaimable) / Number(totalAllocation)) * 100 : 0

    return (
      <div ref={ref} className="relative border border-parchment/20 p-4 hover:border-parchment/30 transition-colors">
        <button
          onClick={onToggle}
          className="w-full flex items-start justify-between"
        >
          <div className="text-left w-full">
            <div className="flex items-center gap-1 mb-1">
              <Icon name="archive" size="md" className="flex-shrink-0 text-parchment/60" />
              <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Total Allocation</div>
              <TooltipIcon
                content="Total amount of tokens allocated across all Token Vaults"
                size="sm"
                maxWidth="max-w-md"
              />
            </div>
            <div className="font-mono text-2xl font-bold text-chartreuse mb-3">
              {formatTokenAmountFull(totalAllocation, decimals, symbol)}
            </div>

            {/* Visualization */}
            {totalAllocation > 0n && (
              <div className="space-y-2">
                <div className="flex h-6 overflow-hidden border border-parchment/20">
                  {/* Locked */}
                  {totalLocked > 0n && (
                    <div
                      className="bg-parchment/30 relative flex items-center justify-center"
                      style={{ width: `${lockedPercent}%` }}
                    >
                      {lockedPercent > 15 && (
                        <span className="text-xs font-oracle-standard font-bold text-parchment">
                          {lockedPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                  {/* Unlocked */}
                  {totalClaimable > 0n && (
                    <div
                      className="bg-chartreuse relative flex items-center justify-center"
                      style={{ width: `${claimablePercent}%` }}
                    >
                      {claimablePercent > 15 && (
                        <span className="text-xs font-oracle-standard font-bold text-ink">
                          {claimablePercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-parchment/30 flex-shrink-0"></div>
                    <span className="text-parchment/70 font-oracle-standard text-[10px]">Locked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-chartreuse flex-shrink-0"></div>
                    <span className="text-parchment/70 font-oracle-standard text-[10px]">Unlocked</span>
                  </div>
                </div>
              </div>
            )}
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
              <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Locked</div>
              <div className="font-mono text-base font-bold text-parchment">
                {formatTokenAmount(totalLocked, decimals, symbol)}
              </div>
              <div className="text-xs text-parchment/50 mt-1">
                {lockedPercent.toFixed(1)}% still vesting in Token Vaults
              </div>
            </div>
            <div>
              <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Unlocked</div>
              <div className="font-mono text-base font-bold text-parchment">
                {formatTokenAmount(totalClaimable, decimals, symbol)}
              </div>
              <div className="text-xs text-parchment/50 mt-1">
                {claimablePercent.toFixed(1)}% ready to claim from Token Vaults
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ATPStakingOverviewTotalAllocation.displayName = 'ATPStakingOverviewTotalAllocation'
