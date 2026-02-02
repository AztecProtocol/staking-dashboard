import { TooltipIcon } from "@/components/Tooltip/TooltipIcon"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"

interface StakeHealthBarProps {
  effectiveBalance: bigint | undefined
  activationThreshold: bigint | undefined
  ejectionThreshold: bigint | undefined
  healthPercentage: number
  slashCount: number
  isAtRisk: boolean
  isCritical: boolean
  isLoading: boolean
}

/**
 * Visual progress bar showing stake health relative to ejection threshold
 * Green = healthy (>50%), Yellow = at risk (25-50%), Red = critical (<25% or below ejection)
 */
export const StakeHealthBar = ({
  effectiveBalance,
  activationThreshold,
  ejectionThreshold,
  healthPercentage,
  slashCount,
  isAtRisk,
  isCritical,
  isLoading,
}: StakeHealthBarProps) => {
  const { symbol, decimals } = useStakingAssetTokenDetails()

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-2 bg-parchment/10 rounded-full" />
      </div>
    )
  }

  const getBarColor = () => {
    if (isCritical) return 'bg-vermillion'
    if (isAtRisk) return 'bg-yellow-500'
    return 'bg-chartreuse'
  }

  const getTextColor = () => {
    if (isCritical) return 'text-vermillion'
    if (isAtRisk) return 'text-yellow-500'
    return 'text-chartreuse'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-parchment/60 uppercase tracking-wide">Stake Health</span>
          <TooltipIcon
            content={`Your effective balance determines validator health. Each slash reduces balance by 2,000 ${symbol || 'tokens'}. Below ejection threshold forces exit.`}
            size="sm"
            maxWidth="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {slashCount > 0 && (
            <span className={`text-xs font-mono ${getTextColor()}`}>
              {slashCount} slash{slashCount !== 1 ? 'es' : ''}
            </span>
          )}
          <span className={`text-xs font-mono font-bold ${getTextColor()}`}>
            {healthPercentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="relative w-full h-2 bg-parchment/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${healthPercentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-parchment/50">
        <span>Ejection: {formatTokenAmount(ejectionThreshold, decimals, symbol)}</span>
        <span>Current: {formatTokenAmount(effectiveBalance, decimals, symbol)}</span>
        <span>Full: {formatTokenAmount(activationThreshold, decimals, symbol)}</span>
      </div>
    </div>
  )
}
