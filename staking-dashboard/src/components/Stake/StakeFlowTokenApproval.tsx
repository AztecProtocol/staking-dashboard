import { useEffect } from "react"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useERC20TokenDetails } from "@/hooks/erc20/useERC20TokenDetails"
import { useAllowance } from "@/hooks/erc20/useAllowance"
import { useApproveStaker } from "@/hooks/atp/useApproveStaker"
import { useStakeableAmount } from "@/hooks/atp/useStakeableAmount"
import { useATPStakingStepsContext, ATPStakingStepsWithTransaction, buildConditionalDependencies } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { Icon } from "@/components/Icon"
import { StakeFlowSelectedAtpDetails } from "@/components/Stake/StakeFlowSelectedAtpDetails"
import { applyHeroItalics } from "@/utils/typographyUtils"

/**
 * Token approval step component for staking flows
 * Displays the amount to approve and handles the approval process
 * Uses ATPStakingStepsContext for shared state, accepts flow-specific props
 */
export const StakeFlowTokenApproval = () => {
  const { formData, updateFormData, handlePrevStep, handleNextStep, currentStep, setStepValid, canContinue } = useATPStakingStepsContext()
  const { selectedAtp, transactionType, stakeCount } = formData
  const { activationThreshold, isLoading: isLoadingRollup } = useRollupData()
  const { addTransaction, checkTransactionInQueue } = useTransactionCart()

  const { symbol, decimals, isLoading: isLoadingToken } = useERC20TokenDetails(selectedAtp?.token!)

  // Check current allowance
  const { allowance, isLoading: isLoadingAllowance } = useAllowance({
    tokenAddress: selectedAtp?.token,
    owner: selectedAtp?.atpAddress,
    spender: selectedAtp?.staker,
  })

  const approveStakerHook = useApproveStaker(selectedAtp?.atpAddress!)

  const { stakeableAmount, isLoading: isLoadingStakeable } = useStakeableAmount(selectedAtp)

  const approvalAmount = activationThreshold && stakeCount > 0
    ? activationThreshold * BigInt(stakeCount)
    : 0n

  const hasEnoughAllowance = allowance !== undefined && allowance >= approvalAmount
  const hasEnoughStakeable = stakeableAmount !== undefined && stakeableAmount >= approvalAmount

  // Check if approval transaction is in the queue
  const approvalTransaction = approvalAmount > 0n && selectedAtp
    ? approveStakerHook.buildRawTx(approvalAmount)
    : null
  const isInQueue = approvalTransaction ? checkTransactionInQueue(approvalTransaction) : false

  const handleAddToQueue = () => {
    if (!selectedAtp || approvalAmount <= 0n) {
      return
    }

    const transaction = approveStakerHook.buildRawTx(approvalAmount)

    addTransaction({
      type: transactionType,
      label: "Approve Tokens",
      description: `Approve ${formatTokenAmount(approvalAmount, decimals, symbol)}`,
      transaction,
      metadata: {
        ...formData.transactionMetadata,
        atpAddress: selectedAtp.atpAddress,
        amount: approvalAmount,
        stepType: ATPStakingStepsWithTransaction.TokenApproval,
        stakeCount: stakeCount,
        stepGroupIdentifier: selectedAtp.atpAddress,
        dependsOn: buildConditionalDependencies(selectedAtp.atpAddress, [
          { condition: !formData.isOperatorConfigured, stepType: ATPStakingStepsWithTransaction.OperatorUpdate },
          { condition: !formData.isStakerUpgraded, stepType: ATPStakingStepsWithTransaction.StakerUpgrade }
        ])
      }
    }, { preventDuplicate: true })
  }

  useEffect(() => {
    updateFormData({ approvalAmount: allowance })
  }, [allowance, updateFormData])

  // Auto skip the step if the conditions are met
  useEffect(() => {
    // Set if the tokens are approved and met minimum requirements to stake
    if (hasEnoughAllowance && hasEnoughStakeable) {
      updateFormData({ isTokenApproved: true })
    }

    // Skip this step if conditions met
    setStepValid(currentStep, (hasEnoughAllowance || isInQueue) && hasEnoughStakeable)
  }, [hasEnoughAllowance, isInQueue, hasEnoughStakeable, currentStep, setStepValid, updateFormData])

  const isLoading = isLoadingRollup || isLoadingToken || isLoadingAllowance || isLoadingStakeable
  const isApproving = approveStakerHook.isPending || approveStakerHook.isConfirming

  return (
    <div className="space-y-6">
      {/* Selected ATP Details */}
      <StakeFlowSelectedAtpDetails selectedAtp={selectedAtp} className="mb-6" />

      <div className="text-center mb-8">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics("Approve Token Spending")}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto">
          Allow the staking contract to spend your tokens for staking operations.
        </p>
      </div>

      {/* Approval Amount Display */}
      <div className="bg-parchment/5 border border-parchment/20 p-6">
        {isLoading ? (
          <div className="text-center text-parchment/60">Loading approval amount...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Amount to Approve</div>
              <div className="text-2xl font-mono font-bold text-chartreuse">
                {formatTokenAmount(approvalAmount, decimals, symbol)}
              </div>
              <div className="text-sm text-parchment/50 mt-1">
                {stakeCount} sequencer{stakeCount !== 1 ? 's' : ''} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
              </div>
            </div>

            {/* Current Allowance Status */}
            {allowance !== undefined && stakeCount !== 1 && (
              <div className="pt-4 border-t border-parchment/20">
                <div className="text-xs font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Current Allowance</div>
                <div className={`text-lg font-mono font-bold ${hasEnoughAllowance ? 'text-chartreuse' : 'text-parchment/70'}`}>
                  {formatTokenAmount(allowance, decimals, symbol)}
                  {hasEnoughAllowance && (
                    <span className="ml-2 text-sm">✓</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {!hasEnoughStakeable && !isLoading && (
        <div className="bg-vermillion/10 border border-vermillion/20 p-4">
          <div className="flex items-center gap-2 text-vermillion font-medium mb-2">
            <Icon name="warning" size="lg" />
            <span className="font-oracle-standard text-sm uppercase tracking-wide">Not enough tokens to stake</span>
          </div>
          <div className="text-sm text-parchment/80 mb-2">
            Your tokens available to stake ({formatTokenAmount(stakeableAmount, decimals, symbol)}) are not enough for {stakeCount} sequencer{stakeCount !== 1 ? 's' : ''}.
          </div>
          <div className="text-sm text-parchment/80">
            Required: {formatTokenAmount(approvalAmount, decimals, symbol)}
          </div>
        </div>
      )}

      {hasEnoughAllowance && hasEnoughStakeable && (
        <div className="bg-chartreuse/10 border border-chartreuse/20 p-4">
          <div className="flex items-center gap-2 text-chartreuse font-medium mb-1">
            <Icon name="check" size="lg" />
            <span className="font-oracle-standard text-sm uppercase tracking-wide">Ready to Stake</span>
          </div>
          <div className="text-sm text-parchment/80">
            You can now proceed to stake your tokens.
          </div>
        </div>
      )}

      {/* Action Buttons - only show when approval is needed */}
      {!hasEnoughAllowance && !approveStakerHook.isSuccess && (
        <div className="space-y-3">
          <button
            type="button"
            className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToQueue}
            disabled={!selectedAtp || isLoading || !hasEnoughStakeable || isInQueue}
          >
            {isInQueue ? "In Batch" : "Add to Batch"}
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-50"
          onClick={handlePrevStep}
          disabled={isApproving}
        >
          Back
        </button>
        <button
          type="button"
          className={`flex-1 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider transition-all border-2 ${canContinue()
              ? "bg-chartreuse text-ink border-chartreuse hover:bg-parchment hover:text-ink hover:border-parchment shadow-lg"
              : "bg-parchment/10 text-parchment/50 border-parchment/30 cursor-not-allowed"
            }`}
          onClick={handleNextStep}
          disabled={!canContinue()}
        >
          Continue
        </button>
      </div>
    </div>
  )
}