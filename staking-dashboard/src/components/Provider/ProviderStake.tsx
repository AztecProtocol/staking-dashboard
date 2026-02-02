import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useStakeWithProvider } from "@/hooks/staker/useStakeWithProvider"
import { useERC20TokenDetails } from "@/hooks/erc20/useERC20TokenDetails"
import { useProviderConfigurations } from "@/hooks/stakingRegistry/useProviderConfigurations"
import { useProviderQueueLength } from "@/hooks/stakingRegistry/useProviderQueueLength"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { formatBipsToPercentage } from "@/utils/formatNumber"
import { StakeFlowSelectedAtpDetails, type StakeFlowSelectedAtpDetailsRef } from "@/components/Stake/StakeFlowSelectedAtpDetails"
import { useATPStakingStepsContext, ATPStakingStepsWithTransaction, buildConditionalDependencies } from "@/contexts/ATPStakingStepsContext"
import type { ProviderDelegationForm } from "@/types/stakingForm"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { useAccount } from "wagmi"
import { SuccessAlert } from "@/components/SuccessAlert"
import { useProviderDetail } from "@/hooks/providers/useProviderDetail"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useAlert } from "@/contexts/AlertContext"

interface ProviderStakeProps {
  onComplete: () => void
}

/**
 * Final delegation step component for provider staking
 * Delegates tokens to the selected provider using stakeWithProvider
 * Uses ATPStakingStepsContext for shared fields, accepts flow-specific props
 */
export const ProviderStake = ({
  onComplete
}: ProviderStakeProps) => {
  const { formData, handlePrevStep } = useATPStakingStepsContext<ProviderDelegationForm>()
  const { selectedAtp, transactionType, selectedProvider, stakeCount } = formData
  const { id: providerId, name: providerName } = selectedProvider
  const { address: beneficiary } = useAccount() // TODO : should get the address from atp.beneficiary to handle the condition where the connected address is operator
  const { activationThreshold, version: rollupVersion, isLoading: isLoadingRollup } = useRollupData()
  const { symbol, decimals, isLoading: isLoadingToken } = useERC20TokenDetails(selectedAtp?.token!)
  const { providerTakeRate, isLoading: isLoadingTakeRate, error: takeRateError } = useProviderConfigurations(Number(providerId))
  const { addProviderStake } = useProviderDetail()
  const { addTransaction, openCart, transactions } = useTransactionCart()
  const { showAlert } = useAlert()
  const { queueLength } = useProviderQueueLength(Number(providerId))
  const atpDetailsRef = useRef<StakeFlowSelectedAtpDetailsRef>(null)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [moveWithLatestRollup] = useState(true)
  const [hasCompletedStakingWithQueue, setHasCompletedStakingWithQueue] = useState(false)
  const hasProcessedSuccess = useRef(false)

  const stakeHook = useStakeWithProvider(selectedAtp?.staker!)

  // Calculate stake amount (for delegation, this is stakeCount × activation threshold)
  const totalStakeAmount = activationThreshold ? activationThreshold * BigInt(stakeCount) : 0n

  const delegationsTx = useMemo(() => {
    return transactions.filter(tx =>
      tx.type === "delegation" &&
      tx.metadata?.stepType === ATPStakingStepsWithTransaction.StakeWithProvider &&
      tx.metadata?.providerId === Number(providerId)
    )
  }, [transactions, providerId])

  const pendingDelegationsCount = useMemo(() => {
    return delegationsTx.filter(tx =>
      tx.status === "pending"
    ).length
  }, [delegationsTx, providerId])

  const completedDelegationsCount = useMemo(() => {
    return delegationsTx.filter(tx =>
      tx.status === "completed"
    ).length
  }, [delegationsTx, providerId])

  // Check if the delegation tx's already in tranasction cart and the number of tx's represent the total stake count
  const isInQueue = delegationsTx.length === stakeCount

  // Calculate available sequencer key slots
  const availableSlots = queueLength - pendingDelegationsCount

  // Track when ALL delegation transactions complete (persist count even if tx's are deleted from queue)
  useEffect(() => {
    if (completedDelegationsCount > 0 && completedDelegationsCount >= stakeCount && !hasCompletedStakingWithQueue) {
      setHasCompletedStakingWithQueue(true)
    }
  }, [completedDelegationsCount, stakeCount, hasCompletedStakingWithQueue])

  const isStakingSuccess = useCallback(() => {
    // Check if all delegations in the queue are completed
    if (completedDelegationsCount >= stakeCount) return true

    // Fall back to persisted state (handles case where tx's were deleted from queue)
    return hasCompletedStakingWithQueue
  }, [completedDelegationsCount, stakeCount, hasCompletedStakingWithQueue])

  const handleAddToQueue = () => {
    if (!selectedAtp || !activationThreshold || rollupVersion === undefined || !beneficiary || providerTakeRate === undefined) return

    // Calculate how many more delegations to add (missing count)
    const missingCount = stakeCount - delegationsTx.length

    // If all delegations already in queue, do nothing
    if (missingCount <= 0) {
      return
    }

    // Check if provider has available sequencer key slots for the missing count
    if (availableSlots < missingCount) {
      showAlert('error', `This provider only has ${availableSlots} sequencer key${availableSlots !== 1 ? 's' : ''} available, but you need ${missingCount} more.`)
      return
    }

    // Create only the missing transactions
    for (let i = 0; i < missingCount; i++) {
      const currentIndex = pendingDelegationsCount + i
      const transaction = stakeHook.buildRawTx(
        rollupVersion,
        BigInt(providerId),
        providerTakeRate,
        beneficiary,
        moveWithLatestRollup
      )

      addTransaction({
        type: transactionType,
        label: `Delegate to ${providerName}${stakeCount > 1 ? ` (${currentIndex + 1}/${stakeCount})` : ''}`,
        description: `Delegate ${formatTokenAmount(activationThreshold, decimals, symbol)}`,
        transaction,
        metadata: {
          ...formData.transactionMetadata,
          atpAddress: selectedAtp.atpAddress,
          amount: activationThreshold,
          stepType: ATPStakingStepsWithTransaction.StakeWithProvider,
          stepGroupIdentifier: selectedAtp.atpAddress,
          dependsOn: buildConditionalDependencies(selectedAtp.atpAddress, [
            { condition: !formData.isOperatorConfigured, stepType: ATPStakingStepsWithTransaction.OperatorUpdate },
            { condition: !formData.isStakerUpgraded, stepType: ATPStakingStepsWithTransaction.StakerUpgrade },
            { condition: !formData.isTokenApproved, stepType: ATPStakingStepsWithTransaction.TokenApproval }
          ])
        }
      }, { preventDuplicate: false })
    }

    openCart()
  }

  useEffect(() => {
    const stakingSuccess = isStakingSuccess()
    if (stakingSuccess && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true
      atpDetailsRef.current?.refetchStakeableAmount()
      if (activationThreshold) {
        // Add the total stake amount (all delegations)
        addProviderStake(activationThreshold * BigInt(stakeCount), stakeCount)
      }
      setShowSuccessAlert(true)
      onComplete()
    }
  }, [isStakingSuccess, activationThreshold, stakeCount, addProviderStake])

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false)
  }

  const isLoading = isLoadingRollup || isLoadingToken || isLoadingTakeRate
  const canDelegate = !isLoading && !takeRateError && providerTakeRate !== undefined && beneficiary

  return (
    <div className="space-y-6">
      <SuccessAlert
        isOpen={showSuccessAlert}
        title="Delegation Complete"
        message={stakeCount > 1
          ? `All ${stakeCount} delegations have been completed with ${providerName}.`
          : `Your stake has been delegated to ${providerName}.`}
        onClose={handleCloseSuccessAlert}
      />

      <StakeFlowSelectedAtpDetails ref={atpDetailsRef} selectedAtp={selectedAtp} className="mb-6" />

      <div className="text-center mb-8">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics(`Stake with ${providerName}`)}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto mb-8">
          Complete your stake by delegating your tokens with this provider.
        </p>

        {/* Stake details */}
        <div className="bg-parchment/5 border border-parchment/20 p-6 max-w-md mx-auto mb-8">
          {isLoading ? (
            <div className="text-lg text-parchment/60">Loading stake details...</div>
          ) : (
            <>
              <div className="text-2xl font-mono font-bold text-chartreuse mb-2">
                {formatTokenAmount(totalStakeAmount, decimals, symbol)}
              </div>
              <div className="text-sm font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Total Stake Amount</div>
              <div className="text-sm text-parchment/50 mb-4">
                {stakeCount} delegation{stakeCount !== 1 ? 's' : ''} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
              </div>

              <div className="border-t border-parchment/20 pt-4 space-y-3">
                <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Staking with:</div>

                <div className="space-y-2">
                  {/* Provider Name */}
                  <div className="flex items-center justify-between py-2 px-3 bg-parchment/5 border-l-2 border-aqua">
                    <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider</span>
                    <span className="text-sm font-medium text-aqua">{providerName}</span>
                  </div>

                  {/* Provider ID */}
                  <div className="flex items-center justify-between py-2 px-3 bg-parchment/5">
                    <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider ID</span>
                    <span className="text-sm text-parchment font-mono">{providerId}</span>
                  </div>

                  {/* Provider Fee */}
                  {isLoadingTakeRate ? (
                    <div className="flex items-center justify-between py-2 px-3 bg-parchment/5">
                      <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider Fee</span>
                      <span className="text-sm text-parchment/50">Loading...</span>
                    </div>
                  ) : providerTakeRate !== undefined && providerTakeRate > 0 ? (
                    <div className="flex items-center justify-between py-2 px-3 bg-parchment/5">
                      <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider Fee</span>
                      <span className="text-sm text-parchment font-mono">{formatBipsToPercentage(providerTakeRate)}%</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {takeRateError && (
          <div className="mt-4 p-3 bg-vermillion/10 border border-vermillion/20 rounded max-w-md mx-auto">
            <div className="text-sm font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">Provider Configuration Error</div>
            <div className="text-sm text-parchment/80">
              Failed to load provider take rate. Cannot proceed with staking.
            </div>
          </div>
        )}

        {/* Success display */}
        {isStakingSuccess() && (
          <div className="mt-4 p-3 bg-chartreuse/10 border border-chartreuse/20 rounded text-center max-w-md mx-auto">
            <div className="text-sm font-oracle-standard font-bold text-chartreuse mb-2 uppercase tracking-wide">
              {stakeCount > 1 ? 'All Delegations Successful' : 'Staking Successful'}
            </div>
            <div className="text-sm text-parchment/60">
              {stakeCount > 1
                ? `All ${stakeCount} delegations with ${providerName} are complete and earning rewards.`
                : `Your tokens are now staked with ${providerName} and earning rewards.`}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddToQueue}
          disabled={!canDelegate || isStakingSuccess() || isInQueue}
        >
          {!beneficiary
            ? "Connect Wallet"
            : isInQueue
              ? "In Batch"
              : takeRateError || providerTakeRate === undefined
                ? "Cannot Stake"
                : isStakingSuccess()
                  ? "Staked Successfully"
                  : "Add to Batch"}
        </button>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-50"
            onClick={handlePrevStep}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}