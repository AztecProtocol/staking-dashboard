import { useState, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import { useClaimSplitRewards } from "./useClaimSplitRewards"
import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useWarehouseBalance } from "./useWarehouseBalance"
import { useSplitsWarehouse } from "./useSplitsWarehouse"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import type { Address } from "viem"
import type { SplitData } from "./types"

interface ClaimTask {
  splitContract: Address
  splitData: SplitData
  tokenAddress: Address
  userAddress: Address
  onSuccess?: () => void
}

type ProcessStep = 'idle' | 'processing'

/**
 * Hook to manage claiming multiple split contract rewards sequentially
 * Processes one claim at a time through both distribute and withdraw steps
 */
export const useClaimAllSplitRewards = () => {
  const { address: beneficiary } = useAccount() // TODO : should get the address from atp.beneficiary to handle the condition where the connected address is operator

  const [processStep, setProcessStep] = useState<ProcessStep>('idle')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [tasks, setTasks] = useState<ClaimTask[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [hasTriggeredClaim, setHasTriggeredClaim] = useState(false)

  // Get the current task's split contract address
  const currentTask = currentIndex !== null && tasks[currentIndex] ? tasks[currentIndex] : null

  // Get token address for balance queries
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Fetch balances for current task
  const { warehouseAddress, isLoading: isLoadingWarehouse } = useSplitsWarehouse(currentTask?.splitContract)
  const { rewards: rollupBalance, isLoading: isLoadingRollupBalance } = useSequencerRewards(currentTask?.splitContract || '')
  const { balance: splitContractBalance, isLoading: isLoadingSplitContractBalance } = useERC20Balance(tokenAddress, currentTask?.splitContract)
  const { balance: warehouseBalance, isLoading: isLoadingWarehouseBalance } = useWarehouseBalance(warehouseAddress, beneficiary, tokenAddress)

  const isLoading = isLoadingWarehouse || isLoadingRollupBalance || isLoadingSplitContractBalance || isLoadingWarehouseBalance

  // Use the single claim hook for the current task
  const claimHook = useClaimSplitRewards(
    currentTask?.splitContract,
    currentTask?.splitData || { recipients: [], allocations: [], totalAllocation: 0n, distributionIncentive: 0 },
    currentTask?.tokenAddress,
    currentTask?.userAddress,
    {
      rollupBalance,
      splitContractBalance,
      warehouseBalance
    }
  )

  // Monitor claim completion and move to next task
  useEffect(() => {
    if (!currentTask || processStep !== 'processing' || isLoading) return

    // If current claim succeeded, move to next task
    if (claimHook.isSuccess && claimHook.claimStep === 'idle') {
      const moveToNext = async () => {
        setCompletedCount(prev => prev + 1)

        // Trigger onSuccess callback for current task
        if (currentTask.onSuccess) {
          currentTask.onSuccess()
        }

        // Reset hook first to clean up state
        claimHook.reset()

        // Small delay to ensure state is clean before moving to next task
        await new Promise(resolve => setTimeout(resolve, 100))

        // Move to next task or finish
        if (currentIndex !== null && currentIndex < tasks.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setHasTriggeredClaim(false)
        } else {
          // All tasks completed
          setProcessStep('idle')
          setCurrentIndex(null)
          setHasTriggeredClaim(false)
        }
      }

      moveToNext()
    }

    // Handle errors - cancel entire batch on any error
    if (claimHook.isError) {
      setError(claimHook.error as Error)
      setProcessStep('idle')
      setCurrentIndex(null)
      setHasTriggeredClaim(false)
      claimHook.reset()
    }
  }, [claimHook.isSuccess, claimHook.isError, claimHook.claimStep, currentIndex, tasks.length, processStep, currentTask, isLoading])

  // Start claiming when we have a current task and we're in the 'processing' state
  useEffect(() => {
    if (!currentTask || !beneficiary || processStep !== 'processing' || isLoading) return

    // Only trigger claim if we're idle (not already claiming) and haven't triggered yet for this task
    if (claimHook.claimStep === 'idle' && !claimHook.isClaiming && !hasTriggeredClaim) {
      setHasTriggeredClaim(true)
      claimHook.claim()
    }
  }, [currentTask, beneficiary, processStep, claimHook.claimStep, claimHook.isClaiming, hasTriggeredClaim, isLoading])

  const claimAll = useCallback((newTasks: ClaimTask[]) => {
    if (!beneficiary || newTasks.length === 0) return

    setTasks(newTasks)
    setProcessStep('processing')
    setError(null)
    setCurrentIndex(0)
    setCompletedCount(0)
    setHasTriggeredClaim(false)
  }, [beneficiary])

  const cancel = useCallback(() => {
    setProcessStep('idle')
    setCurrentIndex(null)
    setHasTriggeredClaim(false)
    claimHook.reset()
  }, [])

  const reset = useCallback(() => {
    setProcessStep('idle')
    setCurrentIndex(null)
    setTasks([])
    setError(null)
    setCompletedCount(0)
    setHasTriggeredClaim(false)
    claimHook.reset()
  }, [])

  return {
    claimAll,
    cancel,
    reset,
    isProcessing: processStep === 'processing',
    currentIndex,
    totalTasks: tasks.length,
    completedCount,
    error,
    progress: currentIndex !== null ? `${currentIndex + 1}/${tasks.length}` : null,
    currentStep: currentTask ? claimHook.claimStep : 'idle',
    skipMessage: currentTask ? claimHook.skipMessage : null,
    completedMessage: currentTask ? claimHook.completedMessage : null,
    distributeTxHash: claimHook.distributeTxHash,
    withdrawTxHash: claimHook.withdrawTxHash,
    tasks,
  }
}
