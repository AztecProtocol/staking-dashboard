import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useAccount } from "wagmi"
import { Icon } from "@/components/Icon"
import { StepIndicator } from "@/components/StepIndicator"
import { SuccessAlert } from "@/components/SuccessAlert"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"
import { useAllowance } from "@/hooks/erc20/useAllowance"
import { useApproveStakingRegistry } from "@/hooks/erc20/useApproveStakingRegistry"
import { useWalletStake } from "@/hooks/stakingRegistry/useWalletStake"
import { useProviderConfigurations } from "@/hooks/stakingRegistry/useProviderConfigurations"
import { useProviderQueueLength } from "@/hooks/stakingRegistry/useProviderQueueLength"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { ATPStakingStepsWithTransaction } from "@/contexts/ATPStakingStepsContext"
import { useProviderDetail } from "@/hooks/providers/useProviderDetail"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"
import { useAlert } from "@/contexts/AlertContext"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { formatBipsToPercentage } from "@/utils/formatNumber"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { contracts } from "@/contracts"
import type { ProviderDetail } from "@/hooks/providers/useProviderDetail"

const WALLET_DELEGATION_STEPS_COUNT = 2

interface WalletStakingFlowProps {
  provider: ProviderDetail
  stakeCount: number
  onBack: () => void
  onComplete: () => void
}

/**
 * Wallet staking flow component for ERC20 direct staking with a provider
 * Two-step process:
 * 1. Approve ERC20 tokens for StakingRegistry
 * 2. Stake (delegate) with provider
 */
export const WalletStakingFlow = ({
  provider,
  stakeCount,
  onBack,
  onComplete,
}: WalletStakingFlowProps) => {
  const { address } = useAccount()
  const { activationThreshold, version: rollupVersion, isLoading: isLoadingRollup } = useRollupData()
  const { stakingAssetAddress, symbol, decimals, isLoading: isLoadingToken } = useStakingAssetTokenDetails()
  const { providerTakeRate, isLoading: isLoadingTakeRate, error: takeRateError } = useProviderConfigurations(Number(provider.id))
  const { queueLength, refetchQueueLength } = useProviderQueueLength(Number(provider.id))
  const { addTransaction, openCart, transactions } = useTransactionCart()
  const { showAlert } = useAlert()
  const { addProviderStake, refetch: refetchProviderDetail } = useProviderDetail()
  const { refetch: refetchStakingData } = useAggregatedStakingData()

  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [hasCompletedStaking, setHasCompletedStaking] = useState(false)
  const hasTriggeredCompletion = useRef(false)
  const moveWithLatestRollup = true

  // Unique identifier for this wallet staking flow (used for transaction grouping)
  const flowIdentifier = useMemo(() => `wallet-${address}-${provider.id}`, [address, provider.id])

  // Calculate total approval amount
  const totalAmount = useMemo(() => {
    if (!activationThreshold) return 0n
    return activationThreshold * BigInt(stakeCount)
  }, [activationThreshold, stakeCount])

  // Check current allowance
  const { allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useAllowance({
    tokenAddress: stakingAssetAddress,
    owner: address,
    spender: contracts.stakingRegistry.address,
  })

  const hasEnoughAllowance = allowance !== undefined && allowance >= totalAmount

  // Hooks for building transactions
  const approveHook = useApproveStakingRegistry(stakingAssetAddress)
  const stakeHook = useWalletStake()

  // Track transactions in the queue
  const approvalTx = useMemo(() => {
    return transactions.find(tx =>
      tx.type === "wallet-delegation" &&
      tx.metadata?.stepType === ATPStakingStepsWithTransaction.WalletTokenApproval &&
      tx.metadata?.stepGroupIdentifier === flowIdentifier
    )
  }, [transactions, flowIdentifier])

  const delegationTxs = useMemo(() => {
    return transactions.filter(tx =>
      tx.type === "wallet-delegation" &&
      tx.metadata?.stepType === ATPStakingStepsWithTransaction.WalletStakeWithProvider &&
      tx.metadata?.stepGroupIdentifier === flowIdentifier
    )
  }, [transactions, flowIdentifier])

  const pendingDelegationsCount = useMemo(() => {
    return delegationTxs.filter(tx => tx.status === "pending").length
  }, [delegationTxs])

  const completedDelegationsCount = useMemo(() => {
    return delegationTxs.filter(tx => tx.status === "completed").length
  }, [delegationTxs])

  const isApprovalInQueue = !!approvalTx
  const isApprovalCompleted = approvalTx?.status === "completed"
  const allDelegationsInQueue = delegationTxs.length === stakeCount

  // Calculate available slots for new delegations.
  // queueLength = available sequencer keys from the contract (not stakers waiting)
  // We subtract pending delegations (in cart but not yet confirmed on-chain)
  // to prevent over-allocation before transactions confirm.
  const availableSlots = queueLength - pendingDelegationsCount

  // Track when all delegations complete
  // Use ref to prevent race conditions - ref updates synchronously unlike state
  useEffect(() => {
    if (completedDelegationsCount > 0 && completedDelegationsCount >= stakeCount && !hasTriggeredCompletion.current) {
      hasTriggeredCompletion.current = true
      setHasCompletedStaking(true)
      refetchAllowance()
      refetchQueueLength()
      refetchStakingData()
      refetchProviderDetail()
      if (activationThreshold) {
        addProviderStake(activationThreshold * BigInt(stakeCount), stakeCount)
      }
      setShowSuccessAlert(true)
      onComplete()
    }
  }, [completedDelegationsCount, stakeCount, activationThreshold, addProviderStake, onComplete, refetchAllowance, refetchQueueLength, refetchStakingData, refetchProviderDetail])

  // Auto-advance to step 2 when approval is complete or allowance is sufficient
  useEffect(() => {
    if ((hasEnoughAllowance || isApprovalCompleted) && currentStep === 1) {
      setCurrentStep(2)
    }
  }, [hasEnoughAllowance, isApprovalCompleted, currentStep])

  const handleAddApprovalToQueue = useCallback(() => {
    if (!stakingAssetAddress || totalAmount <= 0n) return

    const transaction = approveHook.buildRawTx(totalAmount)

    addTransaction({
      type: "wallet-delegation",
      label: "Approve Tokens",
      description: `Approve ${formatTokenAmount(totalAmount, decimals, symbol)} for staking`,
      transaction,
      metadata: {
        stepType: ATPStakingStepsWithTransaction.WalletTokenApproval,
        stepGroupIdentifier: flowIdentifier,
        amount: totalAmount,
        stakeCount,
        providerId: Number(provider.id),
        providerName: provider.name,
        walletAddress: address,
      }
    }, { preventDuplicate: true })

    // Advance to delegation step after adding approval to queue
    setCurrentStep(2)
  }, [stakingAssetAddress, totalAmount, decimals, symbol, flowIdentifier, stakeCount, provider, address, approveHook, addTransaction])

  const handleAddDelegationsToQueue = useCallback(() => {
    if (!address || !activationThreshold || rollupVersion === undefined || providerTakeRate === undefined || takeRateError) return

    const missingCount = stakeCount - delegationTxs.length
    if (missingCount <= 0) return

    if (availableSlots < missingCount) {
      showAlert('error', `This provider only has ${availableSlots} sequencer key${availableSlots !== 1 ? 's' : ''} available, but you need ${missingCount} more.`)
      return
    }

    for (let i = 0; i < missingCount; i++) {
      const currentIndex = pendingDelegationsCount + i
      const transaction = stakeHook.buildRawTx(
        BigInt(provider.id),
        rollupVersion,
        address,
        providerTakeRate,
        address,
        moveWithLatestRollup,
      )

      addTransaction({
        type: "wallet-delegation",
        label: `Delegate to ${provider.name}${stakeCount > 1 ? ` (${currentIndex + 1}/${stakeCount})` : ''}`,
        description: `Delegate ${formatTokenAmount(activationThreshold, decimals, symbol)}`,
        transaction,
        metadata: {
          stepType: ATPStakingStepsWithTransaction.WalletStakeWithProvider,
          stepGroupIdentifier: flowIdentifier,
          amount: activationThreshold,
          stakeCount,
          providerId: Number(provider.id),
          providerName: provider.name,
          walletAddress: address,
          dependsOn: !hasEnoughAllowance && !isApprovalCompleted ? [{
            stepType: ATPStakingStepsWithTransaction.WalletTokenApproval,
            stepName: "Approve Tokens",
            stepGroupIdentifier: flowIdentifier,
          }] : undefined,
        }
      }, { preventDuplicate: false })
    }

    openCart()
  }, [address, activationThreshold, rollupVersion, providerTakeRate, takeRateError, stakeCount, delegationTxs.length, availableSlots, pendingDelegationsCount, provider, decimals, symbol, flowIdentifier, hasEnoughAllowance, isApprovalCompleted, moveWithLatestRollup, stakeHook, addTransaction, openCart, showAlert])

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false)
  }

  const isLoading = isLoadingRollup || isLoadingToken || isLoadingAllowance || isLoadingTakeRate

  const canProceedToStep2 = hasEnoughAllowance || isApprovalInQueue || isApprovalCompleted

  // Render Step 1: Token Approval
  const renderApprovalStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics("Approve Token Spending")}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto">
          Allow the staking contract to spend your tokens for delegation.
        </p>
      </div>

      {/* Approval Amount Display */}
      <div className="bg-parchment/5 border border-parchment/20 p-6">
        {isLoading ? (
          <div className="text-center text-parchment/60">Loading approval details...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Amount to Approve</div>
              <div className="text-2xl font-mono font-bold text-chartreuse">
                {formatTokenAmount(totalAmount, decimals, symbol)}
              </div>
              <div className="text-sm text-parchment/50 mt-1">
                {stakeCount} delegation{stakeCount !== 1 ? 's' : ''} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
              </div>
            </div>

            {/* Current Allowance Status */}
            {allowance !== undefined && (
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
      {hasEnoughAllowance && (
        <div className="bg-chartreuse/10 border border-chartreuse/20 p-4">
          <div className="flex items-center gap-2 text-chartreuse font-medium mb-1">
            <Icon name="check" size="lg" />
            <span className="font-oracle-standard text-sm uppercase tracking-wide">Tokens Already Approved</span>
          </div>
          <div className="text-sm text-parchment/80">
            You have sufficient allowance. Proceed to delegation.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!hasEnoughAllowance && (
        <button
          type="button"
          className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddApprovalToQueue}
          disabled={isLoading || isApprovalInQueue}
        >
          {isApprovalInQueue ? "In Batch" : "Add to Batch"}
        </button>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className={`flex-1 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider transition-all border-2 ${
            canProceedToStep2
              ? "bg-chartreuse text-ink border-chartreuse hover:bg-parchment hover:text-ink hover:border-parchment shadow-lg"
              : "bg-parchment/10 text-parchment/50 border-parchment/30 cursor-not-allowed"
          }`}
          onClick={() => setCurrentStep(2)}
          disabled={!canProceedToStep2}
        >
          Continue
        </button>
      </div>
    </div>
  )

  // Render Step 2: Delegation
  const renderDelegationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics(`Stake with ${provider.name}`)}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto">
          Complete your stake by delegating your tokens with this provider.
        </p>
      </div>

      {/* Stake details */}
      <div className="bg-parchment/5 border border-parchment/20 p-6">
        {isLoading ? (
          <div className="text-center text-parchment/60">Loading stake details...</div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-chartreuse mb-2">
                {formatTokenAmount(totalAmount, decimals, symbol)}
              </div>
              <div className="text-sm font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Total Stake Amount</div>
              <div className="text-sm text-parchment/50 mb-4">
                {stakeCount} delegation{stakeCount !== 1 ? 's' : ''} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
              </div>
            </div>

            <div className="border-t border-parchment/20 pt-4 space-y-3">
              <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Staking with:</div>

              <div className="space-y-2">
                {/* Provider Name */}
                <div className="flex items-center justify-between py-2 px-3 bg-parchment/5 border-l-2 border-chartreuse">
                  <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider</span>
                  <span className="text-sm font-medium text-chartreuse">{provider.name}</span>
                </div>

                {/* Provider ID */}
                <div className="flex items-center justify-between py-2 px-3 bg-parchment/5">
                  <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider ID</span>
                  <span className="text-sm text-parchment font-mono">{provider.id}</span>
                </div>

                {/* Provider Fee */}
                {providerTakeRate !== undefined && providerTakeRate > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-parchment/5">
                    <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Provider Fee</span>
                    <span className="text-sm text-parchment font-mono">{formatBipsToPercentage(providerTakeRate)}%</span>
                  </div>
                )}

                {/* Source */}
                <div className="flex items-center justify-between py-2 px-3 bg-parchment/5">
                  <span className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Source</span>
                  <span className="text-sm text-chartreuse font-medium">Wallet</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error display */}
      {takeRateError && (
        <div className="bg-vermillion/10 border border-vermillion/20 p-4">
          <div className="text-sm font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">Provider Configuration Error</div>
          <div className="text-sm text-parchment/80">
            Failed to load provider take rate. Cannot proceed with staking.
          </div>
        </div>
      )}

      {/* Success display */}
      {hasCompletedStaking && (
        <div className="bg-chartreuse/10 border border-chartreuse/20 p-4 text-center">
          <div className="text-sm font-oracle-standard font-bold text-chartreuse mb-2 uppercase tracking-wide">
            {stakeCount > 1 ? 'All Delegations Successful' : 'Staking Successful'}
          </div>
          <div className="text-sm text-parchment/60">
            {stakeCount > 1
              ? `All ${stakeCount} delegations with ${provider.name} are complete and earning rewards.`
              : `Your tokens are now staked with ${provider.name} and earning rewards.`}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <button
        type="button"
        className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAddDelegationsToQueue}
        disabled={isLoading || !address || takeRateError !== null || hasCompletedStaking || allDelegationsInQueue}
      >
        {!address
          ? "Connect Wallet"
          : allDelegationsInQueue
            ? "In Batch"
            : takeRateError
              ? "Cannot Stake"
              : hasCompletedStaking
                ? "Staked Successfully"
                : "Add to Batch"}
      </button>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
          onClick={() => setCurrentStep(1)}
        >
          Back
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <SuccessAlert
        isOpen={showSuccessAlert}
        title="Delegation Complete"
        message={stakeCount > 1
          ? `All ${stakeCount} delegations have been completed with ${provider.name}.`
          : `Your stake has been delegated to ${provider.name}.`}
        onClose={handleCloseSuccessAlert}
      />

      {/* Step Indicator */}
      <div className="pb-4 border-b border-parchment/10 overflow-hidden">
        <div className="w-full max-w-full">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={WALLET_DELEGATION_STEPS_COUNT}
            className="mb-2"
          />
        </div>
        <p className="text-center text-parchment/60 text-sm mt-3">
          Step {currentStep} of {WALLET_DELEGATION_STEPS_COUNT}
        </p>
      </div>

      {/* Step Content */}
      <div className="space-y-8">
        {currentStep === 1 && renderApprovalStep()}
        {currentStep === 2 && renderDelegationStep()}
      </div>
    </div>
  )
}
