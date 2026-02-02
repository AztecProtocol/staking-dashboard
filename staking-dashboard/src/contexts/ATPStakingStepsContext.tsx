import { createContext, useContext, type ReactNode } from "react"
import type { Address } from "viem"
import type { BaseStakingForm } from "@/types/stakingForm"
import type { TransactionDependency } from "./TransactionCartContextType"

export enum ATPStakingStepsWithTransaction {
  OperatorUpdate,
  StakerUpgrade,
  TokenApproval,
  StakeWithProvider,
  Stake,
  // Wallet staking steps (for ERC20 direct staking)
  WalletTokenApproval,
  WalletStakeWithProvider,
  WalletDirectStake,
}

export const ATPStakingStepsWithTransactionName = new Map<ATPStakingStepsWithTransaction, string>([
  [ATPStakingStepsWithTransaction.OperatorUpdate, "Operator Update"],
  [ATPStakingStepsWithTransaction.StakerUpgrade, "Staker Upgrade"],
  [ATPStakingStepsWithTransaction.TokenApproval, "Token Approval"],
  [ATPStakingStepsWithTransaction.StakeWithProvider, "Delegate"],
  [ATPStakingStepsWithTransaction.Stake, "Self Stake"],
  [ATPStakingStepsWithTransaction.WalletTokenApproval, "Approve Tokens"],
  [ATPStakingStepsWithTransaction.WalletStakeWithProvider, "Delegate"],
  [ATPStakingStepsWithTransaction.WalletDirectStake, "Register Sequencer"],
])

/**
 * Helper function to build a transaction dependency with automatic step name resolution
 */
export function buildTransactionDependency(
  stepType: ATPStakingStepsWithTransaction,
  atpAddress: Address
): TransactionDependency<ATPStakingStepsWithTransaction> {
  return {
    stepType,
    stepName: ATPStakingStepsWithTransactionName.get(stepType),
    stepGroupIdentifier: atpAddress
  }
}

/**
 * Helper function to build conditional dependencies based on form state
 * Filters out conditions that are false and builds dependencies for true conditions
 */
export function buildConditionalDependencies(
  atpAddress: Address,
  conditions: Array<{ condition: boolean; stepType: ATPStakingStepsWithTransaction }>
): TransactionDependency<ATPStakingStepsWithTransaction>[] {
  return conditions
    .filter(c => c.condition)
    .map(c => buildTransactionDependency(c.stepType, atpAddress))
}

export interface ATPStakingStepsContextValue<T extends BaseStakingForm> {
  currentStep: number
  formData: T
  visitedSteps: Set<number>
  updateFormData: (updates: Partial<T>) => void
  handleNextStep: () => void
  handlePrevStep: () => void
  goToStep: (step: number) => void
  isFirstVisit: (step: number) => boolean
  setStepValid: (step: number, isValid: boolean, autoSkip?: boolean) => void
  canContinue: (step?: number) => boolean
  resetVisitedSteps: () => void
  resetStepsTo: (stepNumber: number) => void
  validateFormData: () => boolean
  getValidationErrors: () => string[]
}

const ATPStakingStepsContext = createContext<ATPStakingStepsContextValue<any> | undefined>(undefined)

interface ATPStakingStepsProviderProps<T extends BaseStakingForm> {
  children: ReactNode
  value: ATPStakingStepsContextValue<T>
}

/**
 * Provider for ATP staking steps flow state management
 * Wraps all staking steps and provides shared state and navigation
 * Used by validator registration and provider delegation flows
 * Generic type allows extending base form with flow-specific fields
 * Accepts hook state via value prop for flexibility across different flows
 */
export const ATPStakingStepsProvider = <T extends BaseStakingForm>({
  children,
  value
}: ATPStakingStepsProviderProps<T>) => {
  const isFirstVisit = (step: number) => !value.visitedSteps.has(step)

  return (
    <ATPStakingStepsContext.Provider
      value={{
        ...value,
        isFirstVisit
      }}
    >
      {children}
    </ATPStakingStepsContext.Provider>
  )
}

/**
 * Hook to access ATP staking steps context with type safety
 * Returns default empty state if used outside provider
 * Generic type allows accessing flow-specific fields
 */
export const useATPStakingStepsContext = <T extends BaseStakingForm = BaseStakingForm>() => {
  const context = useContext(ATPStakingStepsContext)

  if (!context) {
    return {
      currentStep: 1,
      formData: {
        selectedAtp: null,
        selectedStakerVersion: null,
        selectedOperator: null,
        isTokenApproved: false,
        isStakerUpgraded: false,
        isOperatorConfigured: false,
        approvalAmount: null
      } as T,
      visitedSteps: new Set([1]),
      updateFormData: () => {},
      handleNextStep: () => {},
      handlePrevStep: () => {},
      goToStep: () => {},
      isFirstVisit: () => true,
      setStepValid: () => {},
      canContinue: () => false,
      resetVisitedSteps: () => {},
      resetStepsTo: () => {},
      validateFormData: () => false,
      getValidationErrors: () => []
    }
  }

  return context as ATPStakingStepsContextValue<T>
}
