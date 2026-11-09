import { TooltipIcon } from "@/components/Tooltip/TooltipIcon"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"

interface StakeHealthBarProps {
  effectiveBalance: bigint | undefined
  activationThreshold: bigint | undefined
  ejectionThreshold: bigint | undefined
  /** % of the activation→ejection cushion still intact. Drives bar fill + color. */
  healthPercentage: number
  /** Cumulative stake lost relative to activation threshold (raw + percentage). */
  lossAmount: bigint
  lossPercentage: number
  isAtRisk: boolean
  isCritical: boolean
  isLoading: boolean
}

/**
 * Visual progress bar showing stake health relative to the ejection threshold.
 * Green = healthy (>50% cushion), Yellow = at risk (25-50%), Red = critical
 * (<25% or below ejection).
 *
 * `healthPercentage` here is the cushion (activation→ejection) remaining —
 * it's what the user actually wants to know ("am I close to being ejected?").
 * Cumulative slashed amount is shown as a separate headline so a small slash
 * that eats a big chunk of cushion isn't misread as catastrophic loss.
 */
export const StakeHealthBar = ({
  effectiveBalance,
  activationThreshold,
  ejectionThreshold,
  healthPercentage,
  lossAmount,
  lossPercentage,
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
    return 'text-accent'
  }

  const hasLoss = lossAmount > 0n

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-parchment/60 uppercase tracking-wide">Stake Health</span>
          <TooltipIcon
            content="The bar shows how much of the cushion between your activation balance and the ejection threshold is still intact — falling below 0 forces an exit. The slashed line shows your cumulative stake loss."
            size="sm"
            maxWidth="max-w-xs"
          />
        </div>
        <span className={`text-xs font-mono font-bold ${getTextColor()}`}>
          {healthPercentage.toFixed(0)}% cushion
        </span>
      </div>

      {hasLoss && (
        <div className={`text-xs font-mono ${getTextColor()}`}>
          Slashed: {formatTokenAmount(lossAmount, decimals, symbol)} ({lossPercentage.toFixed(2)}% of stake)
        </div>
      )}

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
