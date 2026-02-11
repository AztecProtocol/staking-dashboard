import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useERC20TokenDetails } from "@/hooks/erc20/useERC20TokenDetails"
import { useATPStakingStepsContext, ATPStakingStepsWithTransaction, buildConditionalDependencies } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useStake } from "@/hooks/staker/useStake"
import { useAlert } from "@/contexts/AlertContext"
import { Icon } from "@/components/Icon"
import { StakeFlowSelectedAtpDetails, type StakeFlowSelectedAtpDetailsRef } from "@/components/Stake/StakeFlowSelectedAtpDetails"
import { convertRawToValidatorKeys, validateValidatorKeys } from "@/types/keystore"
import type { ValidatorRegistrationForm } from "@/types/stakingForm"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { getValidatorDashboardQueueUrl } from "@/utils/validatorDashboardUtils"
import { SuccessAlert } from "@/components/SuccessAlert"
import { useValidatorQueueTracking } from "@/hooks/registration/useValidatorQueueTracking"
import { useValidatorStatus } from "@/hooks/registration/useValidatorStatus"
import { RegistrationStakeSequencerSummary } from "./RegistrationStakeSequencerSummary"
import { RegistrationStakeSequencerList } from "./RegistrationStakeSequencerList"

interface RegistrationStakeProps {
  onComplete: () => void
}

/**
 * Final stake step component for sequencer registration
 * Stakes sequencer keys with the configured activation threshold
 * Uses ATPStakingStepsContext for all state management
 */
export const RegistrationStake = ({ onComplete }: RegistrationStakeProps) => {
  const { formData, handlePrevStep } = useATPStakingStepsContext<ValidatorRegistrationForm>()
  const { selectedAtp, uploadedKeystores, transactionType } = formData
  const { activationThreshold, version: rollupVersion, isLoading: isLoadingRollup } = useRollupData()
  const { symbol, decimals, isLoading: isLoadingToken } = useERC20TokenDetails(selectedAtp?.token!)
  const { addTransaction, checkTransactionInQueue, isSafe, openCart } = useTransactionCart()
  const { showAlert } = useAlert()
  const [moveWithLatestRollup] = useState<boolean>(true)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const atpDetailsRef = useRef<StakeFlowSelectedAtpDetailsRef>(null)

  const stakeHook = useStake(selectedAtp?.staker!)

  const totalStakeAmount = activationThreshold && uploadedKeystores.length > 0
    ? activationThreshold * BigInt(uploadedKeystores.length)
    : 0n

  const areAllKeystoresValid = uploadedKeystores.every((keystore) =>
    validateValidatorKeys(convertRawToValidatorKeys(keystore))
  )

  // Build transaction helper for queue tracking
  const buildValidatorTransaction = useCallback((keystore: typeof uploadedKeystores[0]) => {
    if (rollupVersion === undefined) return null

    const validatorKeys = convertRawToValidatorKeys(keystore)
    if (!validateValidatorKeys(validatorKeys)) return null

    return stakeHook.buildRawTx(
      rollupVersion,
      validatorKeys.attester as `0x${string}`,
      validatorKeys.publicKeyG1,
      validatorKeys.publicKeyG2,
      validatorKeys.proofOfPossession,
      moveWithLatestRollup
    )
  }, [rollupVersion, stakeHook, moveWithLatestRollup])

  // Check if a validator is in the queue
  const isValidatorInQueue = useCallback((keystore: typeof uploadedKeystores[0]): boolean => {
    const transaction = buildValidatorTransaction(keystore)
    return transaction ? checkTransactionInQueue(transaction) : false
  }, [buildValidatorTransaction, checkTransactionInQueue])

  // Queue tracking hook
  const { completedValidatorsWithQueue } = useValidatorQueueTracking({
    uploadedKeystores,
    buildValidatorTransaction
  })

  // Show success alert when all validators are executed via queue
  useEffect(() => {
    if (uploadedKeystores.length === 0) return

    if (completedValidatorsWithQueue.size >= uploadedKeystores.length) {
      setShowSuccessAlert(true)
    }
  }, [completedValidatorsWithQueue, uploadedKeystores.length])

  // Calculate which validators are currently queued
  const queuedValidators = useMemo(() => {
    const queued = new Set<string>()
    uploadedKeystores.forEach(keystore => {
      if (isValidatorInQueue(keystore)) {
        queued.add(keystore.attester)
      }
    })
    return queued
  }, [uploadedKeystores, isValidatorInQueue])

  // Status calculations hook
  const {
    numberOfAttesters,
    remainingCount,
    queuedCount,
    allRemainingQueued,
    allStakedOrQueued
  } = useValidatorStatus({
    uploadedKeystores,
    completedValidatorsWithQueue,
    queuedValidators
  })

  // Check if all validators are completed (not in queue anymore)
  const allValidatorsCompleted = uploadedKeystores.every(k =>
    completedValidatorsWithQueue.has(k.attester)
  )

  const handleAddValidatorToQueue = (index: number) => {
    const keystore = uploadedKeystores[index]
    if (rollupVersion === undefined || !selectedAtp || !activationThreshold || completedValidatorsWithQueue.has(keystore.attester)) return

    const transaction = buildValidatorTransaction(keystore)
    if (!transaction) return

    addTransaction({
      type: transactionType,
      label: `Stake Sequencer ${index + 1}`,
      description: `Stake ${keystore.attester.slice(0, 10)}...`,
      transaction,
      metadata: {
        ...formData.transactionMetadata,
        atpAddress: selectedAtp.atpAddress,
        amount: activationThreshold,
        stepType: ATPStakingStepsWithTransaction.Stake,
        stepGroupIdentifier: selectedAtp.atpAddress,
        dependsOn: buildConditionalDependencies(selectedAtp.atpAddress, [
          { condition: !formData.isOperatorConfigured, stepType: ATPStakingStepsWithTransaction.OperatorUpdate },
          { condition: !formData.isStakerUpgraded, stepType: ATPStakingStepsWithTransaction.StakerUpgrade },
          { condition: !formData.isTokenApproved, stepType: ATPStakingStepsWithTransaction.TokenApproval }
        ])
      }
    }, { preventDuplicate: true })

    openCart()
  }

  const handleAddAllToQueue = () => {
    if (!selectedAtp || rollupVersion === undefined || uploadedKeystores.length === 0) return
    if (!areAllKeystoresValid) {
      showAlert('error', 'Invalid keystores detected')
      return
    }

    let addedCount = 0
    // Add all validators to queue
    uploadedKeystores.forEach((keystore, index) => {
      if (completedValidatorsWithQueue.has(keystore.attester)) return // Skip executed
      if (isValidatorInQueue(keystore)) return 

      handleAddValidatorToQueue(index)
      addedCount++
    })

    if (addedCount > 0) {
      openCart()
    }
  }

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false)
    onComplete()
  }

  const isLoading = isLoadingRollup || isLoadingToken

  return (
    <div className="space-y-6">
      <SuccessAlert
        isOpen={showSuccessAlert}
        title="Registration Complete"
        message={
          <>
            Your sequencer keys have been registered. Check the{" "}
            <a
              href={getValidatorDashboardQueueUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-chartreuse underline hover:text-chartreuse/80 font-bold"
            >
              queue
            </a>{" "}
            to monitor activation.
          </>
        }
        onClose={handleCloseSuccessAlert}
      />

      <StakeFlowSelectedAtpDetails ref={atpDetailsRef} selectedAtp={selectedAtp} className="mb-6" />

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-arizona-serif text-2xl font-medium mb-2 text-parchment">
          {applyHeroItalics("Stake Sequencers")}
        </h2>
        <p className="text-parchment/70 text-sm">
          Complete your sequencer registration by staking your keys on the network.
        </p>
      </div>

      {/* Multiple Transaction Warning - Prominent (only for EOA, not Safe) */}
      {numberOfAttesters > 1 && !isSafe && (
        <div className="bg-chartreuse/15 border-2 border-chartreuse/40 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="info" size="lg" className="text-chartreuse flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-oracle-standard text-sm font-bold text-chartreuse uppercase tracking-wide mb-2">
                Multiple Transactions Required
              </div>
              <div className="text-sm text-parchment/90 leading-relaxed">
                You are registering <span className="font-bold text-chartreuse">{numberOfAttesters} sequencers</span>, which will require <span className="font-bold text-chartreuse">{numberOfAttesters} separate wallet confirmations</span>. Please approve each transaction when prompted by your wallet.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stake Summary Card */}
      <RegistrationStakeSequencerSummary
        numberOfAttesters={numberOfAttesters}
        activationThreshold={activationThreshold}
        totalStakeAmount={totalStakeAmount}
        decimals={decimals!}
        symbol={symbol!}
        isLoading={isLoading}
      />

      {/* Sequencer List */}
      <RegistrationStakeSequencerList
        uploadedKeystores={uploadedKeystores}
        completedValidatorsWithQueue={completedValidatorsWithQueue}
        isLoading={isLoading}
        isValidatorInQueue={isValidatorInQueue}
        onAddValidatorToQueue={handleAddValidatorToQueue}
      />

      {/* Messages */}
      {!areAllKeystoresValid && (
        <div className="bg-vermillion/10 border border-vermillion/20 p-3 mb-4">
          <div className="text-sm font-oracle-standard font-bold text-vermillion uppercase tracking-wide">
            Some Keystores Have Invalid Data
          </div>
        </div>
      )}

      {/* All Queued - Ready to Execute */}
      {allRemainingQueued && (
        <div className="bg-chartreuse/15 border-2 border-chartreuse/40 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="shoppingCart" size="lg" className="text-chartreuse flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-oracle-standard text-sm font-bold text-chartreuse uppercase tracking-wide mb-2">
                {isSafe ? 'Ready for Safe Approval' : 'Ready to Execute'}
              </div>
              <div className="text-sm text-parchment/90 leading-relaxed space-y-2">
                {isSafe ? (
                  <>
                    <p>
                      <span className="font-bold text-chartreuse">{queuedCount} sequencer{queuedCount !== 1 ? 's are' : ' is'}</span> queued in your transaction cart.
                    </p>
                    <p>
                      <span className="font-bold">Next steps:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                      <li>Open the transaction cart (shopping cart icon)</li>
                      <li>Click "Execute All" to submit the batch to your Safe</li>
                      <li>Approve and execute the batch transaction in your Safe wallet</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="font-bold text-chartreuse">{queuedCount} sequencer{queuedCount !== 1 ? 's are' : ' is'}</span> queued in your transaction cart.
                    </p>
                    <p>
                      Open the <span className="font-bold">transaction cart</span> (shopping cart icon) and click <span className="font-bold">"Execute All"</span> to process {queuedCount === 1 ? 'the transaction' : 'all transactions'} sequentially. 
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Queue Execution */}
      {queuedCount > 0 && !allRemainingQueued && (
        <div className="bg-aqua/10 border border-aqua/30 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="clock" size="lg" className="text-aqua flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-oracle-standard text-sm font-bold text-aqua uppercase tracking-wide mb-2">
                Waiting for Execution
              </div>
              <div className="text-sm text-parchment/90 leading-relaxed">
                <span className="font-bold text-aqua">{queuedCount} sequencer{queuedCount !== 1 ? 's are' : ' is'}</span> still in the transaction cart. Execute {queuedCount === 1 ? 'the transaction' : 'all transactions'} to complete the registration.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add All to Queue - only show when not all validators are queued */}
      {!allStakedOrQueued && (
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 px-6 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-50 whitespace-nowrap"
            onClick={handleAddAllToQueue}
            disabled={isLoading || !areAllKeystoresValid || remainingCount === 0}
          >
            {remainingCount === 0
              ? "All Queued"
              : remainingCount === numberOfAttesters
                ? "Add All to Queue"
                : `Add ${remainingCount} to Queue`}
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePrevStep}
        >
          Back
        </button>
        <button
          type="button"
          className="flex-1 bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onComplete}
          disabled={!allValidatorsCompleted}
        >
          Complete
        </button>
      </div>
    </div>
  )
}