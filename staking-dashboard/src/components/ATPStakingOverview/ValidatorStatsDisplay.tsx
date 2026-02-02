import { useState, useMemo } from "react"
import { Icon } from "@/components/Icon"
import { formatTokenAmount } from "@/utils/atpFormatters"
import type { StakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"

interface ValidatorStatsDisplayProps {
  stakeableAtps: StakeableATPData[]
  totalValidatorCount: number
  totalStakeableAmount: bigint
  activationThreshold: bigint
  decimals: number
  symbol: string
}

/**
 * Component that displays validator capacity stats with ATP breakdown
 */
export const ValidatorStatsDisplay = ({
  stakeableAtps,
  totalValidatorCount,
  totalStakeableAmount,
  activationThreshold,
  decimals,
  symbol
}: ValidatorStatsDisplayProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Sort ATPs by stakeable amount (descending)
  const sortedStakeableAtps = useMemo(() => {
    return [...stakeableAtps].sort((a, b) => {
      const stakeableA = a.stakeableAmount || 0n
      const stakeableB = b.stakeableAmount || 0n
      return stakeableB > stakeableA ? 1 : stakeableB < stakeableA ? -1 : 0
    })
  }, [stakeableAtps])

  if (totalValidatorCount === 0) return null

  return (
    <div className="border border-parchment/20 p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-parchment" />
          <span className="text-sm font-oracle-standard text-parchment uppercase tracking-wide">
            Validator Capacity
          </span>
        </div>
        {stakeableAtps.length > 1 && (
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1 text-xs text-parchment/60 hover:text-parchment transition-colors font-oracle-standard uppercase tracking-wide"
          >
            {showBreakdown ? 'Hide' : 'Show'} Details
            <Icon
              name="chevronDown"
              size="sm"
              className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Total Validators</div>
          <div className="font-mono text-lg font-bold text-parchment">
            {totalValidatorCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Total Stakeable</div>
          <div className="font-mono text-lg font-bold text-aqua">
            {formatTokenAmount(totalStakeableAmount, decimals, symbol)}
          </div>
        </div>
      </div>

      <div className="text-xs text-parchment/60 border-t border-parchment/20 pt-3">
        Each validator requires {formatTokenAmount(activationThreshold, decimals, symbol)} minimum stake
      </div>

      {/* ATP Breakdown */}
      {sortedStakeableAtps.length > 1 && showBreakdown && (
        <div className="mt-4 border-t border-parchment/20 pt-4 space-y-2">
          <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard mb-3">
            By Token Vault
          </div>
          {sortedStakeableAtps.map((atp) => {
            const atpValidators = activationThreshold && atp.stakeableAmount
              ? Number(atp.stakeableAmount / activationThreshold)
              : 0
            const displayNumber = atp.sequentialNumber || '?'
            return (
              <div key={atp.atpAddress} className="flex items-center justify-between py-2 border-b border-parchment/10 last:border-b-0">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-parchment/60" />
                  <span className="text-sm text-parchment">Token Vault #{displayNumber}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-parchment/70">
                    {formatTokenAmount(atp.stakeableAmount || 0n, decimals, symbol)}
                  </span>
                  <span className="text-sm font-bold text-parchment">
                    {atpValidators} validator{atpValidators !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}