import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { useClaimAllRewards } from "@/hooks/rewards"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import { ClaimAllRewardsSummary } from "./ClaimAllRewardsSummary"
import { ClaimAllRewardsProgress } from "./ClaimAllRewardsProgress"
import { ClaimAllRewardsSuccess } from "./ClaimAllRewardsSuccess"
import type { DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { CoinbaseBreakdown } from "@/hooks/rewards/rewardsTypes"

type ModalPhase = 'summary' | 'progress' | 'success'

interface ClaimAllRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  delegations: DelegationBreakdown[]
  coinbases: CoinbaseBreakdown[]
  pendingWarehouseWithdrawal?: bigint
  onSuccess?: () => void
}

/**
 * Modal for claiming all rewards in a unified flow
 * Handles both delegation rewards (3-step) and self-stake rewards (1-step)
 */
export const ClaimAllRewardsModal = ({
  isOpen,
  onClose,
  delegations,
  coinbases,
  pendingWarehouseWithdrawal = 0n,
  onSuccess
}: ClaimAllRewardsModalProps) => {
  const [phase, setPhase] = useState<ModalPhase>('summary')

  // Token details
  const { symbol, decimals } = useStakingAssetTokenDetails()

  // Check if rewards are claimable
  const { isRewardsClaimable } = useIsRewardsClaimable()

  // Claim hook
  const claimAllRewards = useClaimAllRewards()

  // Reset phase when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('summary')
      claimAllRewards.reset()
    }
  }, [isOpen])

  // Transition to progress when claiming starts
  useEffect(() => {
    if (claimAllRewards.isProcessing && phase === 'summary') {
      setPhase('progress')
    }
  }, [claimAllRewards.isProcessing, phase])

  // Transition to success when all done
  useEffect(() => {
    if (claimAllRewards.isSuccess && phase === 'progress') {
      setPhase('success')
      onSuccess?.()
    }
  }, [claimAllRewards.isSuccess, phase, onSuccess])

  const handleClose = () => {
    if (claimAllRewards.isProcessing) {
      // Don't allow closing while processing - user must cancel
      return
    }
    claimAllRewards.reset()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !claimAllRewards.isProcessing) {
      handleClose()
    }
  }

  const handleStartClaiming = () => {
    claimAllRewards.startClaiming(delegations, coinbases)
  }

  const handleCancel = () => {
    claimAllRewards.cancelClaiming()
    setPhase('summary')
  }

  const handleRetry = () => {
    claimAllRewards.retryFailed()
  }

  const handleDone = () => {
    claimAllRewards.reset()
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 backdrop-blur-xs z-[200] flex items-center justify-center p-4 pt-20"
      onClick={handleBackdropClick}
    >
      <div className="bg-ink border-2 border-chartreuse/40 w-full max-w-lg relative max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
        {/* Close button - only show when not processing */}
        {!claimAllRewards.isProcessing && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-parchment/60 hover:text-parchment transition-colors"
          >
            <Icon name="x" size="md" />
          </button>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 mt-1">
              <Icon
                name={phase === 'success' ? 'check' : phase === 'progress' ? 'loader' : 'gift'}
                size="lg"
                className={`w-8 h-8 ${
                  phase === 'success' ? 'text-chartreuse' :
                  phase === 'progress' ? 'text-chartreuse animate-spin' :
                  'text-chartreuse'
                }`}
              />
            </div>
            <div className="flex-1">
              <h2 className="font-arizona-serif text-2xl font-medium text-parchment mb-2">
                {phase === 'success' ? 'Rewards Claimed' :
                 phase === 'progress' ? 'Claiming Rewards' :
                 'Claim All Rewards'}
              </h2>
              <p className="text-parchment/80 text-sm leading-relaxed">
                {phase === 'success' ? 'Your rewards have been successfully claimed.' :
                 phase === 'progress' ? 'Processing your claims. Please approve each transaction.' :
                 'Review and claim all your available rewards.'}
              </p>
            </div>
          </div>

          {/* Content */}
          {phase === 'summary' && (
            <ClaimAllRewardsSummary
              delegations={delegations}
              coinbases={coinbases}
              pendingWarehouseWithdrawal={pendingWarehouseWithdrawal}
              decimals={decimals ?? 18}
              symbol={symbol ?? ""}
              isRewardsClaimable={isRewardsClaimable ?? false}
              onStartClaiming={handleStartClaiming}
              isDisabled={false}
            />
          )}

          {phase === 'progress' && (
            <ClaimAllRewardsProgress
              tasks={claimAllRewards.tasks}
              currentTask={claimAllRewards.currentTask}
              progressPercent={claimAllRewards.progressPercent}
              decimals={decimals ?? 18}
              symbol={symbol ?? ""}
              onCancel={handleCancel}
              isError={claimAllRewards.isError}
              error={claimAllRewards.error}
              onRetry={handleRetry}
            />
          )}

          {phase === 'success' && (
            <ClaimAllRewardsSuccess
              completedTasks={claimAllRewards.completedTasks}
              decimals={decimals ?? 18}
              symbol={symbol ?? ""}
              onClose={handleDone}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
