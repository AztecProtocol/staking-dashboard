import { useEffect, useMemo } from "react"
import type { Address } from "viem"
import { StakeFlowSelectedAtpDetails } from "@/components/Stake/StakeFlowSelectedAtpDetails"
import { TooltipIcon } from "@/components/Tooltip"
import { useStakerImplementations } from "@/hooks/atpRegistry/useStakerImplementations"
import { useAtpRegistryData } from "@/hooks/atpRegistry/useAtpRegistryData"
import { useUpgradeStaker } from "@/hooks/atp/useUpgradeStaker"
import { useATPStakingStepsContext, ATPStakingStepsWithTransaction, buildConditionalDependencies } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import {
  getImplementationDescription,
  getVersionByImplementation
} from "@/utils/stakerVersion"
import { useStakerImplementation as useStakerImplementationFromStaker } from "@/hooks/staker/useStakerImplementation"
import { applyHeroItalics } from "@/utils/typographyUtils"

/**
 * Staker version selection step component for validator registration
 * Allows users to choose the appropriate staker contract version
 * Uses ATPStakingStepsContext for state management
 */
export const StakeFlowStakerVersion = () => {
  const { formData, updateFormData, handlePrevStep, handleNextStep, currentStep, setStepValid, canContinue } = useATPStakingStepsContext()
  const { selectedAtp, transactionType } = formData
  const { addTransaction, checkTransactionInQueue } = useTransactionCart()

  const { stakerVersions, isLoading: isLoadingRegistry } = useAtpRegistryData({
    registryAddress: selectedAtp?.registry
  })

  const latestVersion = useMemo(() => {
    const stakingVersions = stakerVersions.filter(version => version > 0n)
    if (stakingVersions.length > 0) {
      return stakingVersions[stakingVersions.length - 1]
    }
    return null
  }, [stakerVersions])

  const { implementations, isLoading: isLoadingVersions } = useStakerImplementations(stakerVersions, selectedAtp?.registry)

  const {
    implementation: stakerImplementation,
    isLoading: isLoadingStakerImplementation,
  } = useStakerImplementationFromStaker(selectedAtp?.staker as Address);

  const currentVersion = useMemo(() => {
    if (!stakerImplementation || !implementations) return null
    return getVersionByImplementation(stakerImplementation, implementations)
  }, [stakerImplementation, implementations])

  const upgradeStakerHook = useUpgradeStaker(selectedAtp?.atpAddress as Address)

  // Set the selected staker implementation version 
  useEffect(() => {
    updateFormData({ selectedStakerVersion: currentVersion })
  }, [currentVersion, updateFormData])

  const currentDescription = getImplementationDescription(stakerImplementation, currentVersion!)

  const isLoading = isLoadingRegistry || isLoadingVersions || isLoadingStakerImplementation

  const needsUpgrade = currentVersion === null || currentVersion < (latestVersion ?? 0n)

  // Check if upgrade transaction is in the queue
  const upgradeTransaction = latestVersion && selectedAtp
    ? upgradeStakerHook.buildRawTx(latestVersion)
    : null
  const isInQueue = upgradeTransaction ? checkTransactionInQueue(upgradeTransaction) : false

  // Skip this step if staker already on the latest version or the tx is added to the queue
  useEffect(() => {
    // Set if needs upgrade
    if (!needsUpgrade) {
      updateFormData({ isStakerUpgraded: true })
    }

    // Skip this step if conditions met
    setStepValid(currentStep, !needsUpgrade || isInQueue)
  }, [needsUpgrade, isInQueue, currentStep, setStepValid, updateFormData])

  const handleAddToQueue = () => {
    if (!latestVersion || !selectedAtp || !needsUpgrade) {
      return
    }

    const transaction = upgradeStakerHook.buildRawTx(latestVersion)

    addTransaction({
      type: transactionType,
      label: "Upgrade Staker",
      description: `Upgrade to version ${latestVersion.toString()}`,
      transaction,
      metadata: {
        ...formData.transactionMetadata,
        atpAddress: selectedAtp.atpAddress,
        stepType: ATPStakingStepsWithTransaction.StakerUpgrade,
        stepGroupIdentifier: selectedAtp.atpAddress,
        dependsOn: buildConditionalDependencies(selectedAtp.atpAddress, [
          { condition: !formData.isOperatorConfigured, stepType: ATPStakingStepsWithTransaction.OperatorUpdate }
        ])
      }
    }, { preventDuplicate: true })

  }

  return (
    <div className="space-y-6">
      {/* Selected ATP Details */}
      <StakeFlowSelectedAtpDetails selectedAtp={selectedAtp} className="mb-6" />

      <div>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="font-arizona-serif text-2xl font-medium text-parchment">
              {applyHeroItalics("Set Staker Version")}
            </h2>
            <TooltipIcon
              content="Your Token Vault talks to a staker contract to handle staking, delegation, unstaking and rewards. Governance makes this contract available and it is recommended that every Token Vault upgrades to the latest one."
              size="sm"
              maxWidth="max-w-md"
            />
          </div>
          <p className="text-parchment/70 max-w-lg mx-auto">
            The latest staker version includes newest features and security updates.
          </p>
        </div>

        {/* Current Version Display */}
        <div className="bg-parchment/5 border border-parchment/20 p-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Current Staker Version</div>
              <TooltipIcon
                content="Your Token Vault talks to a staker contract to handle staking, delegation, unstaking and rewards. Governance makes this contract available and it is recommended that every Token Vault upgrades to the latest one."
                size="sm"
                maxWidth="max-w-md"
              />
            </div>
            <div className="text-3xl font-mono font-bold text-chartreuse">
              {isLoading ? "..." : !needsUpgrade ? "Latest" : currentVersion !== null ? `Version ${currentVersion.toString()}` : "N/A"}
            </div>
            <div className="text-sm text-parchment/60 mt-1">
              {currentDescription}
            </div>
          </div>
        </div>

        {/* Upgrade section */}
        {needsUpgrade && (
          <div className="space-y-3 mb-6">
            <button
              type="button"
              className="w-full bg-chartreuse text-ink py-3 px-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddToQueue}
              disabled={!selectedAtp || isLoading || isInQueue}
            >
              {isInQueue ? "In Batch" : "Add to Batch"}
            </button>
          </div>
        )}

      </div>

      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
          onClick={handlePrevStep}
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