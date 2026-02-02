import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Icon } from "@/components/Icon"
import { PageHeader } from "@/components/PageHeader"
import { StepIndicator } from "@/components/StepIndicator"
import { WalletConnectGuard } from "@/components/WalletConnectGuard"
import { StakeFlowSelectionConfirmation } from "@/components/Stake/StakeFlowSelectionConfirmation"
import { StakeFlowTokenApproval } from "@/components/Stake/StakeFlowTokenApproval"
import { StakeFlowStakerVersion } from "@/components/Stake/StakeFlowStakerVersion"
import { StakeFlowOperatorUpdate } from "@/components/Stake/StakeFlowOperatorUpdate"
import { RegistrationUploadKeys as StakeFlowRegistrationUploadKeys } from "@/components/Registration/RegistrationUploadKeys"
import { RegistrationStake as StakeFlowRegistrationStake } from "@/components/Registration/RegistrationStake"
import { RegistrationPreInfo } from "@/components/Registration/RegistrationPreInfo"
import { DirectStakingFlowModal } from "@/components/Registration/DirectStakingFlowModal"
import { WalletDirectStakingFlow } from "@/components/Registration/WalletDirectStakingFlow"
import { ATPStakingStepsProvider, useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useStakingNavigation } from "@/hooks/staking/useStakingNavigation"
import { useValidatorRegistrationForm } from "@/hooks/staking/useValidatorRegistrationForm"
import { useATP } from "@/hooks/useATP"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"
import { useATPSelection } from "@/contexts/ATPSelectionContext"
import type { ValidatorRegistrationForm, StakingSourceType } from "@/types/stakingForm"
import type { StakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"

export const REGISTRATION_STEPS_COUNT = 6

/**
 * Inner component that renders the registration steps for ATP (Token Vault) staking
 * Uses ATPStakingStepsContext with ValidatorRegistrationForm type
 */
function RegistrationSteps({ onBack }: { onBack?: () => void }) {
  const { currentStep, goToStep } = useATPStakingStepsContext<ValidatorRegistrationForm>()
  const { refetchAtpData } = useATP()
  const { refetch: refetchStakingData } = useAggregatedStakingData()

  const handleRegistrationComplete = () => {
    refetchAtpData()
    // Using timeout to wait for the indexer store the tx
    setTimeout(() => {
      refetchStakingData()
    }, 10000)
    // Navigate back to step 1
    goToStep(1)
  }

  const steps = [
    { step: 1, component: <StakeFlowSelectionConfirmation onBack={onBack} /> },
    { step: 2, component: <StakeFlowOperatorUpdate /> },
    { step: 3, component: <StakeFlowStakerVersion /> },
    { step: 4, component: <StakeFlowRegistrationUploadKeys /> },
    { step: 5, component: <StakeFlowTokenApproval /> },
    { step: 6, component: <StakeFlowRegistrationStake onComplete={handleRegistrationComplete} /> }
  ]

  return (
    <>
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={REGISTRATION_STEPS_COUNT}
        className="mb-8"
        onStepClick={goToStep}
      />

      <div className="space-y-6">
        {steps.find(s => s.step === currentStep)?.component}
      </div>
    </>
  )
}

/**
 * Register Sequencer page - allows users to register as sequencers
 * and stake their own node with step-by-step process
 * Supports both wallet-based ERC20 staking and ATP (Token Vault) staking
 */
export default function RegisterValidatorPage() {
  const [showPreInfo, setShowPreInfo] = useState(true)
  const navigation = useStakingNavigation(REGISTRATION_STEPS_COUNT)
  const form = useValidatorRegistrationForm()
  const prevSelectedAtpRef = useRef(form.formData.selectedAtp)
  const { selectedAtp: atpFromContext, selectionType, clearSelectedAtp } = useATPSelection()
  const { openCart } = useTransactionCart()

  // Source selection state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<StakingSourceType | null>(null)
  const [selectedVault, setSelectedVault] = useState<StakeableATPData | null>(null)
  const [walletStakeCount, setWalletStakeCount] = useState(1)
  const [isRegistrationCompleted, setIsRegistrationCompleted] = useState(false)

  // auto-populate selectedAtp from context on mount
  // to preselect the atp when user click the stake button from ATPCard
  useEffect(() => {
    if (atpFromContext && selectionType === "self-stake" && !form.formData.selectedAtp) {
      form.updateFormData({ selectedAtp: atpFromContext })
      setShowPreInfo(false)
      setSelectedSource("vault")
      setSelectedVault(atpFromContext as StakeableATPData)
      clearSelectedAtp()
    }
  }, [atpFromContext, selectionType, form, clearSelectedAtp])

  // Reset visited steps and go to step 1 when selectedAtp changes
  useEffect(() => {
    const currentAtp = form.formData.selectedAtp
    const prevAtp = prevSelectedAtpRef.current

    if (currentAtp && prevAtp && currentAtp.atpAddress !== prevAtp.atpAddress) {
      navigation.resetStepsTo(1)
    }

    prevSelectedAtpRef.current = currentAtp
  }, [form.formData.selectedAtp, navigation])

  const handleStartRegistration = () => {
    setShowPreInfo(false)
    setIsModalOpen(true)
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
    setIsModalOpen(false)
  }

  const handleBackToSourceSelection = () => {
    setSelectedSource(null)
    setSelectedVault(null)
    navigation.resetVisitedSteps()
    setIsModalOpen(true)
  }

  const handleResetFlow = () => {
    setIsRegistrationCompleted(false)
    setIsModalOpen(false)
    setSelectedSource(null)
    setSelectedVault(null)
    navigation.resetVisitedSteps()
  }

  // Registration completed state
  if (isRegistrationCompleted) {
    const sourceLabel = selectedSource === "wallet" ? "Wallet" : "Token Vault"
    return (
      <>
        <Link
          to="/stake"
          className="inline-flex mb-4 items-center text-parchment/70 hover:text-parchment transition-colors"
        >
          <Icon name="arrowLeft" size="md" className="mr-2" />
          <span className="font-oracle-standard text-sm">Back to Stake</span>
        </Link>

        <PageHeader
          title="Stake"
          description="Register as a sequencer and stake your own node"
          tooltip="Register your own sequencer node to participate in network consensus and earn rewards."
        />

        <div className="bg-parchment/5 border border-parchment/20 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-chartreuse/20 text-chartreuse rounded-full">
            <Icon name="check" className="w-8 h-8" />
          </div>
          <h3 className="font-md-thermochrome text-2xl text-parchment mb-4">
            Staking Request Complete!
          </h3>
          <p className="text-parchment/70 mb-6">
            Your sequencer staking request via {sourceLabel} has been submitted and added to the activation queue. To stake another sequencer, clear your transaction cart first.
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
              Register Another
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Back Button */}
      <Link
        to="/stake"
        className="inline-flex mb-4 items-center text-parchment/70 hover:text-parchment transition-colors"
      >
        <Icon name="arrowLeft" size="md" className="mr-2" />
        <span className="font-oracle-standard text-sm">Back to Stake</span>
      </Link>

      <PageHeader
        title="Stake"
        description="Register as a sequencer and stake your own node"
        tooltip="Register your own sequencer node to participate in network consensus and earn rewards. This requires technical expertise, running sequencer infrastructure, and a minimum stake requirement."
      />

      {showPreInfo ? (
        <RegistrationPreInfo onStartRegistration={handleStartRegistration} />
      ) : (
        <WalletConnectGuard
          title="Connect to Stake"
          description="Connect your wallet to register as a sequencer and start staking your own node on the network."
          helpText="After connecting, you'll be able to select your staking source, configure your sequencer settings, and register your sequencer node."
        >
          <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-6">
            <h4 className="font-arizona-serif text-xl font-medium text-parchment mb-6">
              Register Sequencer
            </h4>

            {/* Source Selection Modal + Start Button (when no source selected) */}
            {!selectedSource && (
              <>
                <button
                  onClick={handleOpenModal}
                  className="w-full bg-chartreuse text-ink py-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg flex items-center justify-center gap-2"
                >
                  <Icon name="plus" size="lg" />
                  <span>Select Staking Source</span>
                </button>
                <DirectStakingFlowModal
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  onSelectWallet={handleSelectWallet}
                  onSelectVault={handleSelectVault}
                />
              </>
            )}

            {/* Wallet Direct Staking Flow */}
            {selectedSource === "wallet" && (
              <WalletDirectStakingFlow
                stakeCount={walletStakeCount}
                onBack={handleBackToSourceSelection}
                onComplete={() => setIsRegistrationCompleted(true)}
              />
            )}

            {/* ATP Token Vault Staking Flow */}
            {selectedSource === "vault" && selectedVault && (
              <ATPStakingStepsProvider value={{ ...navigation, ...form }}>
                <RegistrationSteps onBack={handleBackToSourceSelection} />
              </ATPStakingStepsProvider>
            )}
          </div>
        </WalletConnectGuard>
      )}
    </>
  )
}