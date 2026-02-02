import { useEffect, useMemo } from "react"
import { Icon } from "@/components/Icon"
import { useActivationThresholdFormatted, useRollupData } from "@/hooks/rollup"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"
import { useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { isStakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"

interface StakeFlowSelectionConfirmationProps {
  onBack?: () => void
}

/**
 * Confirmation step for ATP staking flow
 * Shows selected vault info, stake count, and staking rules
 * Used when vault is pre-selected from the source selection modal
 */
export const StakeFlowSelectionConfirmation = ({ onBack }: StakeFlowSelectionConfirmationProps) => {
  const { formData, handleNextStep, handlePrevStep, currentStep, setStepValid } = useATPStakingStepsContext()
  const { selectedAtp, stakeCount } = formData
  const { formattedThreshold } = useActivationThresholdFormatted()
  const { activationThreshold } = useRollupData()
  const { decimals, symbol } = useStakingAssetTokenDetails()

  // Get stakeable amount - either from StakeableATPData or calculate from stakeCount
  const stakeableAmount = useMemo(() => {
    if (isStakeableATPData(selectedAtp)) {
      return selectedAtp.stakeableAmount
    }
    // Fallback: calculate from stakeCount and activationThreshold
    if (activationThreshold && stakeCount > 0) {
      return activationThreshold * BigInt(stakeCount)
    }
    return undefined
  }, [selectedAtp, activationThreshold, stakeCount])

  // Mark step as valid when we have selected ATP and stake count
  useEffect(() => {
    setStepValid(currentStep, selectedAtp !== null && stakeCount > 0)
  }, [selectedAtp, stakeCount, currentStep, setStepValid])

  if (!selectedAtp) {
    return (
      <div className="bg-parchment/5 border border-parchment/20 p-6 text-center">
        <p className="text-parchment/70">No Token Vault selected. Please go back and select a vault.</p>
        <button
          onClick={onBack ?? handlePrevStep}
          className="mt-4 bg-parchment/10 text-parchment border border-parchment/30 px-4 py-2 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 transition-all"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <div>
        <h3 className="font-oracle-standard text-sm font-bold uppercase tracking-wide text-parchment/70 mb-4 mt-4">
          Your Vault Selection
        </h3>

        <div className="bg-parchment/5 border border-parchment/20 p-4 space-y-4">
          {/* Selected Vault */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-aqua/20 text-aqua">
                <Icon name="archive" className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide">Token Vault</div>
                <div className="text-sm font-mono text-parchment">
                  {selectedAtp.atpAddress.slice(0, 8)}...{selectedAtp.atpAddress.slice(-6)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-parchment/60 uppercase tracking-wide">Available</div>
              <div className="text-sm font-mono text-aqua">
                {decimals !== undefined && symbol && stakeableAmount !== undefined
                  ? formatTokenAmount(stakeableAmount, decimals, symbol)
                  : "..."}
              </div>
            </div>
          </div>

          {/* Stake Count */}
          <div className="flex items-center justify-between pt-4 border-t border-parchment/10">
            <div>
              <div className="text-xs text-parchment/60 uppercase tracking-wide">Stakes to Create</div>
              <div className="text-2xl font-mono font-bold text-chartreuse">{stakeCount}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-parchment/60 uppercase tracking-wide">Total Amount</div>
              <div className="text-sm font-mono text-chartreuse">
                {formattedThreshold ? `${stakeCount} × ${formattedThreshold}` : "..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staking Rules Notice */}
      <div className="border border-parchment/20 bg-parchment/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="info" size="md" className="text-parchment/60 flex-shrink-0" />
          <p className="text-sm font-oracle-standard font-bold text-parchment">Staking Requirements</p>
        </div>
        <ul className="space-y-1.5 text-sm text-parchment/70 ml-7 list-disc">
          <li>Requires exactly <span className="font-mono text-chartreuse">{formattedThreshold}</span> per sequencer</li>
          <li>One Token Vault at a time</li>
          <li>Multiple transactions needed for additional stakes</li>
          <li>Minimum <span className="font-mono text-chartreuse">{formattedThreshold}</span> required</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            className="flex-1 bg-parchment/10 text-parchment py-3 px-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 transition-all duration-300 border-2 border-parchment/30"
            onClick={onBack}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="flex-1 bg-chartreuse text-ink py-3 px-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment"
          onClick={handleNextStep}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
