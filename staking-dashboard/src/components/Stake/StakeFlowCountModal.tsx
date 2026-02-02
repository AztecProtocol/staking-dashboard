import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"
import { useStakeableAmount } from "@/hooks/atp/useStakeableAmount"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"
import { useTransactionCart } from "@/contexts/TransactionCartContext"

interface StakeFlowCountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (count: number) => void
}

/**
 * Modal to set the number of stakes/delegations to create
 * Calculates max based on selected ATP stakeable amount (if selected), otherwise uses maxStakesCount from formData
 */
export const StakeFlowCountModal = ({
  isOpen,
  onConfirm
}: StakeFlowCountModalProps) => {
  const { formData, updateFormData } = useATPStakingStepsContext()
  const { stakeCount, maxStakesCount, selectedAtp, transactionType } = formData

  const { symbol, decimals } = useStakingAssetTokenDetails()
  const { stakeableAmount } = useStakeableAmount(selectedAtp)
  const { activationThreshold } = useRollupData()
  const { clearByType } = useTransactionCart()

  const [count, setCount] = useState(stakeCount)
  const [useSelectedAtp, setUseSelectedAtp] = useState(true)

  useEffect(() => {
    if (stakeCount) {
      setCount(stakeCount)
    }
  }, [stakeCount])

  const maxCount = useMemo(() => {
    // If user toggles to use selected ATP and ATP is selected
    if (useSelectedAtp && selectedAtp && activationThreshold) {
      const maxFromSelectedAtp = Number(stakeableAmount / activationThreshold)
      return Math.min(maxFromSelectedAtp, maxStakesCount ? maxStakesCount : 1)
    }
    // Otherwise use the flow's maxStakesCount
    return maxStakesCount ? maxStakesCount : 1
  }, [useSelectedAtp, selectedAtp, activationThreshold, stakeableAmount, maxStakesCount])

  // Calculate total tokens consumed
  const totalTokens = useMemo(() => {
    if (!activationThreshold) return 0n
    return activationThreshold * BigInt(count)
  }, [activationThreshold, count])

  if (!isOpen) return null

  const handleConfirm = () => {
    // Clear transaction cart by type if stake count has changed
    if (count !== stakeCount && transactionType) {
      clearByType(transactionType)
    }

    // If confirmed count exceeds selected ATP's capacity, user needs to reselect
    // The ATP list will be filtered based on the new count
    if (selectedAtp && activationThreshold) {
      const maxFromSelectedAtp = Number(stakeableAmount / activationThreshold)
      if (count > maxFromSelectedAtp) {
        // Clear selected ATP so user can choose one that supports the count
        updateFormData({ selectedAtp: null })
      }
    }

    onConfirm(count)
  }

  const canIncrease = count < maxCount
  const canDecrease = count > 1

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-malachite border-2 border-chartreuse max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="font-arizona-serif text-xl font-medium text-parchment mb-2">
            Stake Count
          </h3>
          <p className="text-sm text-parchment/70">
            How many stakes do you want to create?
          </p>
        </div>

        {/* Counter */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => setCount(Math.max(1, count - 1))}
              disabled={!canDecrease}
              className="w-12 h-12 bg-parchment/10 border-2 border-parchment/30 flex items-center justify-center hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-2xl font-bold text-parchment"
            >
              −
            </button>

            <div className="text-center min-w-[120px]">
              <div className="text-5xl font-mono font-bold text-chartreuse">
                {count}
              </div>
              <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard mt-2">
                Stake{count !== 1 ? "s" : ""}
              </div>
              {activationThreshold && activationThreshold > 0n && decimals !== undefined && symbol && (
                <div className="text-xs text-aqua font-mono mt-2">
                  {formatTokenAmount(totalTokens, decimals, symbol)}
                </div>
              )}
            </div>

            <button
              onClick={() => setCount(Math.min(maxCount, count + 1))}
              disabled={!canIncrease}
              className="w-12 h-12 bg-parchment/10 border-2 border-parchment/30 flex items-center justify-center hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="plus" size="lg" />
            </button>
          </div>

          {/* Min/Max buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setCount(1)}
              disabled={count === 1}
              className="px-4 py-2 bg-parchment/10 border border-parchment/30 text-xs font-oracle-standard uppercase tracking-wide text-parchment hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Min (1)
            </button>
            <button
              onClick={() => setCount(maxCount)}
              disabled={count === maxCount}
              className="px-4 py-2 bg-chartreuse/10 border border-chartreuse/30 text-xs font-oracle-standard uppercase tracking-wide text-chartreuse hover:bg-chartreuse/20 hover:border-chartreuse/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Max ({maxCount})
            </button>
          </div>
        </div>

        {/* Max count info */}
        <div className="bg-parchment/5 border border-parchment/20 p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
              Maximum Available
            </div>
            {selectedAtp && (
              <button
                onClick={() => setUseSelectedAtp(!useSelectedAtp)}
                className="px-2 py-1 bg-parchment/10 border border-parchment/30 text-xs text-parchment hover:bg-parchment/20 hover:border-parchment/50 transition-all"
              >
                {useSelectedAtp ? "Selected Vault" : "Max Allowed"}
              </button>
            )}
          </div>
          <div className="text-sm text-parchment">
            You can create up to <span className="font-bold text-chartreuse">{maxCount}</span> stake{maxCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleConfirm}
          className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment"
        >
          Confirm
        </button>
      </div>
    </div>,
    document.body
  )
}
