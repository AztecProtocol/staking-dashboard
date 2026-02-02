import { useState, useEffect, useRef } from "react"
import { Icon } from "@/components/Icon"
import { WalletConnectGuard } from "@/components/WalletConnectGuard"
import { StepIndicator } from "@/components/StepIndicator"
import { StakeFlowSelectionConfirmation } from "@/components/Stake/StakeFlowSelectionConfirmation"
import { StakeFlowStakerVersion } from "@/components/Stake/StakeFlowStakerVersion"
import { StakeFlowOperatorUpdate } from "@/components/Stake/StakeFlowOperatorUpdate"
import { StakeFlowTokenApproval } from "@/components/Stake/StakeFlowTokenApproval"
import { ProviderStake } from "@/components/Provider/ProviderStake"
import { DelegateStakeButton } from "@/components/Provider/DelegateStakeButton"
import { StakingFlowModal } from "@/components/Provider/StakingFlowModal"
import { WalletStakingFlow } from "@/components/Provider/WalletStakingFlow"
import { ATPStakingStepsProvider, useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useStakingNavigation } from "@/hooks/staking/useStakingNavigation"
import { useProviderDelegationForm } from "@/hooks/staking/useProviderDelegationForm"
import { useProviderQueueLength } from "@/hooks/stakingRegistry"
import { useATP } from "@/hooks/useATP"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"
import { useATPSelection } from "@/contexts/ATPSelectionContext"
import type { ProviderDelegationForm, StakingSourceType } from "@/types/stakingForm"
import { useProviderDetail, type ProviderDetail } from "@/hooks/providers/useProviderDetail"
import type { StakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"

interface StakingFlowFeatureProps {
  provider: ProviderDetail
}

export const DELEGATION_STEPS_COUNT = 5

/**
 * Inner component that renders the delegation steps
 * Uses ATPStakingStepsContext with ProviderDelegationForm type
 */
function DelegationSteps({
  onDelegationSuccess,
  onBack,
}: {
  onDelegationSuccess?: () => void
  onBack?: () => void
}) {
  const { currentStep, goToStep } = useATPStakingStepsContext<ProviderDelegationForm>()
  const { refetch: refetchStakingData } = useAggregatedStakingData()
  const { refetch: refetchProviderDetail } = useProviderDetail()
  const { refetchAtpData } = useATP()

  const handleDelegationComplete = () => {
    refetchAtpData()
    onDelegationSuccess?.()
    // Using timeout to wait for the indexer store the tx
    setTimeout(() => {
      refetchStakingData()
      refetchProviderDetail()
    }, 10000)
  }

  const steps = [
    { step: 1, component: <StakeFlowSelectionConfirmation onBack={onBack} /> },
    { step: 2, component: <StakeFlowOperatorUpdate /> },
    { step: 3, component: <StakeFlowStakerVersion /> },
    { step: 4, component: <StakeFlowTokenApproval /> },
    {
      step: 5,
      component: (
        <ProviderStake
          onComplete={handleDelegationComplete}
        />
      )
    }
  ]

  return (
    <>
      {/* Step Indicator */}
      <div className="pb-4 border-b border-parchment/10 overflow-hidden">
        <div className="w-full max-w-full">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={DELEGATION_STEPS_COUNT}
            className="mb-2"
            onStepClick={goToStep}
          />
        </div>
        <p className="text-center text-parchment/60 text-sm mt-3">
          Step {currentStep} of {DELEGATION_STEPS_COUNT}
        </p>
      </div>

      {/* Step Content */}
      <div className="space-y-8">
        {steps.find(s => s.step === currentStep)?.component}
      </div>
    </>
  )
}

export const ProviderStakingFlow = ({ provider }: StakingFlowFeatureProps) => {
  const navigation = useStakingNavigation(DELEGATION_STEPS_COUNT)

  const form = useProviderDelegationForm(provider)
  const formData = form.formData

  const { queueLength, refetchQueueLength } = useProviderQueueLength(Number(provider.id))
  const { selectedAtp: atpFromContext, selectionType, clearSelectedAtp } = useATPSelection()
  const { openCart } = useTransactionCart()

  const [isDelegationCompleted, setIsDelegationCompleted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<StakingSourceType | null>(null)
  const [selectedVault, setSelectedVault] = useState<StakeableATPData | null>(null)
  const [walletStakeCount, setWalletStakeCount] = useState(1)
  const prevSelectedAtpRef = useRef(formData.selectedAtp)

  // auto-populate selectedAtp from context on mount
  // to preselect the atp when user click the stake button from ATPCard
  useEffect(() => {
    if (atpFromContext && selectionType === "delegation" && !formData.selectedAtp) {
      clearSelectedAtp()
    }
  }, [atpFromContext, selectionType, formData.selectedAtp, clearSelectedAtp])

  // Set maxStakesCount based on provider queue length,
  // the user cant stake more than provider keys left
  useEffect(() => {
    if (formData.maxStakesCount && formData.maxStakesCount > queueLength) {
      form.updateFormData({ maxStakesCount: queueLength })
    }
  }, [queueLength, formData.maxStakesCount])

  // Reset visited steps and go to step 1 when selectedAtp changes
  useEffect(() => {
    const currentAtp = formData.selectedAtp
    const prevAtp = prevSelectedAtpRef.current

    if (currentAtp && prevAtp && currentAtp.atpAddress !== prevAtp.atpAddress) {
      navigation.resetStepsTo(1)
    }

    prevSelectedAtpRef.current = currentAtp
  }, [formData.selectedAtp, navigation])

  const handleResetFlow = () => {
    setIsDelegationCompleted(false)
    setIsModalOpen(false)
    setSelectedSource(null)
    setSelectedVault(null)
    navigation.resetVisitedSteps()
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSelectWallet = (stakeCount: number) => {
    setSelectedSource("wallet")
    setWalletStakeCount(stakeCount)
    setIsModalOpen(false)
  }

  const handleSelectVault = (atp: StakeableATPData, stakeCount: number) => {
    setSelectedSource("vault")
    setSelectedVault(atp)
    form.updateFormData({ selectedAtp: atp, stakeCount })
  }

  const handleBackToSourceSelection = () => {
    setSelectedSource(null)
    setSelectedVault(null)
    navigation.resetVisitedSteps()
    setIsModalOpen(true)
  }

  if (isDelegationCompleted) {
    const sourceLabel = selectedSource === "wallet" ? "Wallet" : "Token Vault"
    return (
      <div className="bg-parchment/5 border border-parchment/20 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-chartreuse/20 text-chartreuse rounded-full">
          <Icon name="check" className="w-8 h-8" />
        </div>
        <h3 className="font-md-thermochrome text-2xl text-parchment mb-4">
          Delegation Complete!
        </h3>
        <p className="text-parchment/70 mb-6">
          Your delegation via {sourceLabel} to {provider.name} is completed. To delegate again, clear or your transaction cart first.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={openCart}
            className="bg-chartreuse text-ink px-6 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all"
          >
            View Cart
          </button>
          <button
            onClick={handleResetFlow}
            className="border border-parchment/30 text-parchment px-6 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/10 transition-all"
          >
            Delegate Another Source
          </button>
        </div>
      </div>
    )
  }

  if (queueLength === 0) {
    return (
      <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-6">
        <h4 className="font-arizona-serif text-xl font-medium text-parchment mb-6">
          Delegate to {provider.name}
        </h4>
        <div className="bg-parchment/10 border border-parchment/30 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-parchment/20 text-parchment/60 rounded-full">
            <Icon name="x" className="w-6 h-6" />
          </div>
          <h5 className="font-oracle-standard text-sm font-bold text-parchment mb-2 uppercase tracking-wide">
            Delegation Unavailable
          </h5>
          <p className="text-parchment/70 text-sm">
            This provider is not currently accepting delegations. No sequencer keys available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-6">
      <h4 className="font-arizona-serif text-xl font-medium text-parchment mb-6">
        Delegate to {provider.name}
      </h4>

      <WalletConnectGuard
        title="Connect to Delegate"
        description="Connect your wallet to delegate your tokens to this provider."
        helpText="After connecting, you'll be able to select your staking method and delegate tokens."
      >
        {/* Delegate Button + Modal (when no source selected) */}
        {!selectedSource && (
          <>
            <DelegateStakeButton onClick={handleOpenModal} />
            <StakingFlowModal
              isOpen={isModalOpen}
              provider={provider}
              onClose={handleCloseModal}
              onSelectWallet={handleSelectWallet}
              onSelectVault={handleSelectVault}
            />
          </>
        )}

        {/* Wallet Staking Flow */}
        {selectedSource === "wallet" && (
          <WalletStakingFlow
            provider={provider}
            stakeCount={walletStakeCount}
            onBack={handleBackToSourceSelection}
            onComplete={() => {
              setIsDelegationCompleted(true)
              refetchQueueLength()
            }}
          />
        )}

        {/* ATP Token Vault Staking Flow */}
        {selectedSource === "vault" && selectedVault && (
          <ATPStakingStepsProvider value={{ ...navigation, ...form }}>
            <DelegationSteps
              onDelegationSuccess={() => {
                setIsDelegationCompleted(true)
                refetchQueueLength()
              }}
              onBack={handleBackToSourceSelection}
            />
          </ATPStakingStepsProvider>
        )}
      </WalletConnectGuard>
    </div>
  )
}