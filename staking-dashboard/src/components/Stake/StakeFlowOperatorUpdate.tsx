import { useEffect } from "react"
import { useUpdateStakerOperator } from "@/hooks/atp/useUpdateStakerOperator"
import { useStakerOperator } from "@/hooks/staker/useStakerOperator"
import { StakeFlowSelectedAtpDetails } from "@/components/Stake/StakeFlowSelectedAtpDetails"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { useATPStakingStepsContext, ATPStakingStepsWithTransaction } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useAccount } from "wagmi"
import { applyHeroItalics } from "@/utils/typographyUtils"

/**
 * Component for updating staker operator address to beneficiary
 * This step ensures the operator is set to the current wallet address
 * Uses ATPStakingStepsContext for state management
 */
export const StakeFlowOperatorUpdate = () => {
  const { formData, updateFormData, handlePrevStep, handleNextStep, currentStep, setStepValid, canContinue } = useATPStakingStepsContext()
  const { addTransaction, checkTransactionInQueue } = useTransactionCart()
  const { selectedAtp, transactionType } = formData
  const { address } = useAccount()

  const { operator: currentOperator, isLoading: isLoadingOperator } = useStakerOperator(selectedAtp?.staker as `0x${string}`)

  const updateOperatorHook = useUpdateStakerOperator(selectedAtp?.atpAddress as `0x${string}`)

  const isCurrentAddressOperator = address && currentOperator?.toLowerCase() === address.toLowerCase()
  const isZeroAddress = currentOperator?.toLowerCase() === '0x0000000000000000000000000000000000000000'
  const needsOperatorUpdate = isCurrentAddressOperator === false

  // Check if operator update transaction is in the queue
  const operatorTransaction = address && selectedAtp
    ? updateOperatorHook.buildRawTx(address)
    : null
  const isInQueue = operatorTransaction ? checkTransactionInQueue(operatorTransaction) : false

  const handleAddToQueue = () => {
    if (!selectedAtp || !address) {
      return
    }

    const transaction = updateOperatorHook.buildRawTx(address)

    addTransaction({
      type: transactionType,
      label: "Set Operator",
      description: `Set operator to ${address}`,
      transaction,
      metadata: {
        ...formData.transactionMetadata,
        atpAddress: selectedAtp.atpAddress,
        operatorAddress: address,
        stepType: ATPStakingStepsWithTransaction.OperatorUpdate,
        stepGroupIdentifier: selectedAtp.atpAddress
      }
    }, { preventDuplicate: true })
  }

  // Set the selected operator
  useEffect(() => {
    updateFormData({ selectedOperator: currentOperator })
  }, [currentOperator, needsOperatorUpdate, updateFormData])

  // Skip this step if set opeartor added in queue or the operator does not need update (already benefficiary)
  useEffect(() => {
    // Set if operator already configured
    if (!needsOperatorUpdate) {
      updateFormData({ isOperatorConfigured: true })
    }

    // Skip if conditions met
    setStepValid(currentStep, !needsOperatorUpdate || isInQueue)
  }, [needsOperatorUpdate, isInQueue, currentStep, setStepValid, updateFormData])

  const isLoading = updateOperatorHook.isPending || updateOperatorHook.isConfirming || isLoadingOperator

  return (
    <div className="space-y-6">
      {/* Selected ATP Details */}
      <StakeFlowSelectedAtpDetails selectedAtp={selectedAtp} />

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <h2 className="font-arizona-serif text-2xl font-medium text-parchment">
            {applyHeroItalics(needsOperatorUpdate ? 'Set Operator Address' : 'Operator Configuration')}
          </h2>
          <TooltipIcon
            content="The operator address handles staking operations, governance voting, and sequencer management. As both beneficiary and operator, you maintain full control while being able to perform all operations."
            size="sm"
            maxWidth="max-w-md"
          />
        </div>
        <p className="text-parchment/70 max-w-lg mx-auto">
          {needsOperatorUpdate
            ? 'Set your wallet as the operator to handle staking and governance operations.'
            : 'Review and optionally update the operator address for this Token Vault.'
          }
        </p>
      </div>

      {/* Current vs New Operator Comparison */}
      <div className="space-y-4">
        {/* Current Operator */}
        <div className="bg-parchment/5 border border-parchment/20 p-4">
          <div className="text-xs font-oracle-standard uppercase tracking-wide text-parchment/60 mb-3">
            Current Operator
          </div>
          {isLoadingOperator ? (
            <div className="text-sm text-parchment/50">Loading...</div>
          ) : currentOperator && !isZeroAddress ? (
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-sm text-chartreuse break-all">
                {currentOperator}
              </div>
              {isCurrentAddressOperator && (
                <div className="flex items-center gap-1 bg-chartreuse/20 px-2 py-1 text-xs font-medium text-chartreuse shrink-0">
                  <Icon name="check" size="sm" />
                  You
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-parchment/50">No operator set</div>
          )}
        </div>

        {/* New Operator */}
        {(needsOperatorUpdate || !isCurrentAddressOperator) && (
          <div className="bg-chartreuse/5 border border-chartreuse/30 p-4">
            <div className="text-xs font-oracle-standard uppercase tracking-wide text-parchment/60 mb-3">
              {needsOperatorUpdate ? 'Set As Operator' : 'Update To'}
            </div>
            <div className="space-y-1">
              <div className="font-mono text-sm text-chartreuse break-all">
                {address}
              </div>
              <div className="text-xs text-parchment/60">
                Your connected wallet
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - only show when operator update is needed */}
      {needsOperatorUpdate && (
        <div className="space-y-3">
          <button
            type="button"
            className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToQueue}
            disabled={!selectedAtp || !address || isLoading || isInQueue}
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
          disabled={isLoading}
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