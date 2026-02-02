import { forwardRef } from "react"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import { formatTokenAmount, formatTokenAmountFull } from "@/utils/atpFormatters"

interface ATPStakingOverviewStakeableAmountProps {
  totalStakeableAmount: bigint
  totalValidatorCount: number
  activationThreshold: bigint | null
  isExpanded: boolean
  onToggle: () => void
  decimals: number
  symbol: string
  totalStaked: bigint
}

/**
 * Displays stakeable amount with breakdown of validator count and per-validator threshold
 */
export const ATPStakingOverviewStakeableAmount = forwardRef<HTMLDivElement, ATPStakingOverviewStakeableAmountProps>(
  ({ totalStakeableAmount, totalStaked, totalValidatorCount, activationThreshold, isExpanded, onToggle, decimals, symbol }, ref) => {

    // Calculate capacity breakdown
    const totalAvailable = totalStakeableAmount + totalStaked
    const stakedPercent = totalAvailable > 0n ? (Number(totalStaked) / Number(totalAvailable)) * 100 : 0
    const availablePercent = totalAvailable > 0n ? (Number(totalStakeableAmount) / Number(totalAvailable)) * 100 : 0

    return (
      <div ref={ref} className="relative border border-parchment/20 p-4 hover:border-parchment/30 transition-colors">
        <button
          onClick={onToggle}
          className="w-full flex items-start justify-between"
        >
          <div className="text-left w-full">
            <div className="flex items-center gap-1 mb-1">
              <Icon name="currency" size="md" className="flex-shrink-0 text-parchment/60" />
              <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Available To Stake</div>
              <TooltipIcon
                content="Tokens available in this token vault that can be used for staking. Note that you can only stake 200,000 tokens at a time, so this amount available is rounded down to the nearest 200,000 increment (e.g. if balance is 190,000, available amount to stake is 0)"
                size="sm"
                maxWidth="max-w-md"
              />
            </div>
            <div className="font-mono text-2xl font-bold text-chartreuse mb-3">
              {formatTokenAmountFull(totalStakeableAmount, decimals, symbol)}
            </div>

            {/* Visualization */}
            <div className="space-y-2">
              <div className="flex h-6 overflow-hidden border border-parchment/20 bg-parchment/5">
                {totalAvailable > 0n ? (
                  <>
                    {/* Staked */}
                    {totalStaked > 0n && (
                      <div
                        className="bg-parchment/30 relative flex items-center justify-center"
                        style={{ width: `${stakedPercent}%` }}
                      >
                        {stakedPercent > 15 && (
                          <span className="text-xs font-oracle-standard font-bold text-parchment">
                            {stakedPercent.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                    {/* Available */}
                    {totalStakeableAmount > 0n && (
                      <div
                        className="bg-chartreuse relative flex items-center justify-center"
                        style={{ width: `${availablePercent}%` }}
                      >
                        {availablePercent > 15 && (
                          <span className="text-xs font-oracle-standard font-bold text-ink">
                            {availablePercent.toFixed(0)}%
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
                  <div className="w-2 h-2 bg-parchment/30 flex-shrink-0"></div>
                  <span className="text-parchment/70 font-oracle-standard text-[10px]">In Use</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-chartreuse flex-shrink-0"></div>
                  <span className="text-parchment/70 font-oracle-standard text-[10px]">Available</span>
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
              <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Total Sequencers</div>
              <div className="font-mono text-base font-bold text-parchment">
                {totalValidatorCount}
              </div>
              <div className="text-xs text-parchment/50 mt-1">
                Can register {totalValidatorCount} sequencer{totalValidatorCount !== 1 ? 's' : ''} or delegate
              </div>
            </div>
            <div>
              <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Per Sequencer</div>
              <div className="font-mono text-base font-bold text-parchment">
                {formatTokenAmount(activationThreshold || 0n, decimals, symbol)}
              </div>
              <div className="text-xs text-parchment/50 mt-1">
                Required stake per sequencer
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ATPStakingOverviewStakeableAmount.displayName = 'ATPStakingOverviewStakeableAmount'
