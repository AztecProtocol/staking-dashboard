import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useClaimAllSplitRewards } from "@/hooks/splits/useClaimAllSplitRewards"
import type { Address } from "viem"
import type { ClaimStep } from "@/hooks/splits/types"

interface ClaimAllContextValue {
  isProcessing: boolean
  currentSplitContract: Address | null
  currentStep: ClaimStep
  getSplitStatus: (splitContract: Address) => 'idle' | 'processing' | 'waiting'
  claimAllHook: ReturnType<typeof useClaimAllSplitRewards>
}

const ClaimAllContext = createContext<ClaimAllContextValue | null>(null)

/**
 * Provider for managing delegation split contracts batch claim state
 * Allows individual claim buttons to reflect batch claim progress
 */
export const ClaimAllProvider = ({ children }: { children: ReactNode }) => {
  const claimAllHook = useClaimAllSplitRewards()

  const currentSplitContract = useMemo(() => {
    const { currentIndex, tasks } = claimAllHook
    return currentIndex !== null && tasks[currentIndex]
      ? tasks[currentIndex].splitContract
      : null
  }, [claimAllHook.currentIndex, claimAllHook.tasks])

  const getSplitStatus = useMemo(() => {
    return (splitContract: Address): 'idle' | 'processing' | 'waiting' => {
      if (!claimAllHook.isProcessing) return 'idle'

      const taskIndex = claimAllHook.tasks.findIndex(
        task => task.splitContract.toLowerCase() === splitContract.toLowerCase()
      )

      if (taskIndex === -1) return 'idle'
      if (taskIndex === claimAllHook.currentIndex) return 'processing'
      return 'waiting'
    }
  }, [claimAllHook.isProcessing, claimAllHook.tasks, claimAllHook.currentIndex])

  const value = useMemo<ClaimAllContextValue>(() => ({
    isProcessing: claimAllHook.isProcessing,
    currentSplitContract,
    currentStep: claimAllHook.currentStep,
    getSplitStatus,
    claimAllHook
  }), [claimAllHook.isProcessing, currentSplitContract, claimAllHook.currentStep, getSplitStatus, claimAllHook])

  return (
    <ClaimAllContext.Provider value={value}>
      {children}
    </ClaimAllContext.Provider>
  )
}

/**
 * Hook to access claim all context
 */
export const useClaimAllContext = () => {
  const context = useContext(ClaimAllContext)
  if (!context) {
    throw new Error('useClaimAllContext must be used within ClaimAllProvider')
  }
  return context
}
