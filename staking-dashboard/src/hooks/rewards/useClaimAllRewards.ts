import { useState, useEffect, useCallback, useRef } from "react"
import { useAccount } from "wagmi"
import { useClaimSplitRewards } from "@/hooks/splits/useClaimSplitRewards"
import { useClaimSequencerRewards } from "@/hooks/rollup/useClaimSequencerRewards"
import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useWarehouseBalance } from "@/hooks/splits/useWarehouseBalance"
import { useSplitsWarehouse } from "@/hooks/splits/useSplitsWarehouse"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import type { Address } from "viem"
import type { SplitData } from "@/hooks/splits/types"
import type { DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { CoinbaseBreakdown } from "./rewardsTypes"

export type ClaimTaskStatus = 'pending' | 'processing' | 'completed' | 'error' | 'skipped'
export type ClaimTaskType = 'delegation' | 'coinbase'

export interface ClaimTask {
  id: string
  type: ClaimTaskType
  displayName: string
  estimatedRewards: bigint
  status: ClaimTaskStatus
  error?: Error
  // Delegation-specific data
  splitContract?: Address
  splitData?: SplitData
  providerTakeRate?: number
  // Coinbase-specific data
  coinbaseAddress?: Address
  // Sub-step tracking for delegations
  currentSubStep?: 'claiming' | 'distributing' | 'withdrawing'
}

interface UseClaimAllRewardsReturn {
  // Actions
  startClaiming: (delegations: DelegationBreakdown[], coinbases: CoinbaseBreakdown[]) => void
  cancelClaiming: () => void
  retryFailed: () => void
  reset: () => void

  // State
  tasks: ClaimTask[]
  currentTask: ClaimTask | null
  currentTaskIndex: number | null
  isProcessing: boolean
  progressPercent: number

  // Results
  isSuccess: boolean
  isError: boolean
  error: Error | null
  completedTasks: ClaimTask[]
  failedTasks: ClaimTask[]
}

/**
 * Hook to orchestrate claiming rewards from multiple delegation splits and coinbase addresses
 * Processes tasks sequentially: delegations first (3 steps each), then coinbases (1 step each)
 */
export const useClaimAllRewards = (): UseClaimAllRewardsReturn => {
  const { address: userAddress } = useAccount()
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Task queue state
  const [tasks, setTasks] = useState<ClaimTask[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasTriggeredClaim, setHasTriggeredClaim] = useState(false)

  // Track if we were cancelled
  const cancelledRef = useRef(false)

  // Get current task
  const currentTask = currentTaskIndex !== null ? tasks[currentTaskIndex] : null

  // Get current task's addresses
  const currentSplitContract = currentTask?.type === 'delegation' ? currentTask.splitContract : undefined
  const currentCoinbase = currentTask?.type === 'coinbase' ? currentTask.coinbaseAddress : undefined

  // Fetch balances for current task (for delegations)
  const { warehouseAddress, isLoading: isLoadingWarehouse } = useSplitsWarehouse(currentSplitContract)
  const { rewards: rollupBalance, isLoading: isLoadingRollup } = useSequencerRewards(currentSplitContract || currentCoinbase || '')
  const { balance: splitContractBalance, isLoading: isLoadingSplitBalance } = useERC20Balance(tokenAddress, currentSplitContract)
  const { balance: warehouseBalance, isLoading: isLoadingWarehouseBalance } = useWarehouseBalance(warehouseAddress, userAddress, tokenAddress)

  const isLoadingBalances = currentTask?.type === 'delegation'
    ? (isLoadingWarehouse || isLoadingRollup || isLoadingSplitBalance || isLoadingWarehouseBalance)
    : isLoadingRollup

  // Use existing hooks for claiming
  const delegationClaimHook = useClaimSplitRewards(
    currentSplitContract,
    currentTask?.splitData || { recipients: [], allocations: [], totalAllocation: 0n, distributionIncentive: 0 },
    tokenAddress,
    userAddress,
    {
      rollupBalance,
      splitContractBalance,
      warehouseBalance
    }
  )

  const coinbaseClaimHook = useClaimSequencerRewards()

  /**
   * Build SplitData from delegation info
   */
  const buildSplitData = useCallback((delegation: DelegationBreakdown, user: Address): SplitData => {
    const totalAllocation = 10000n
    const providerAllocation = BigInt(delegation.providerTakeRate)
    const userAllocation = totalAllocation - providerAllocation

    return {
      recipients: [delegation.providerRewardsRecipient as Address, user],
      allocations: [providerAllocation, userAllocation],
      totalAllocation,
      distributionIncentive: 0
    }
  }, [])

  /**
   * Start claiming all rewards
   */
  const startClaiming = useCallback((delegations: DelegationBreakdown[], coinbases: CoinbaseBreakdown[]) => {
    if (!userAddress || (!delegations.length && !coinbases.length)) return

    cancelledRef.current = false

    // Build task list: delegations first, then coinbases
    const newTasks: ClaimTask[] = [
      ...delegations.map((delegation): ClaimTask => ({
        id: `delegation-${delegation.splitContract}`,
        type: 'delegation',
        displayName: delegation.providerName || `Provider ${delegation.providerId}`,
        estimatedRewards: delegation.rewards,
        status: 'pending',
        splitContract: delegation.splitContract as Address,
        splitData: buildSplitData(delegation, userAddress),
        providerTakeRate: delegation.providerTakeRate
      })),
      ...coinbases.map((coinbase): ClaimTask => ({
        id: `coinbase-${coinbase.address}`,
        type: 'coinbase',
        displayName: `${coinbase.address.slice(0, 6)}...${coinbase.address.slice(-4)}`,
        estimatedRewards: coinbase.rewards,
        status: 'pending',
        coinbaseAddress: coinbase.address
      }))
    ]

    // Filter out tasks with no rewards
    const tasksWithRewards = newTasks.filter(task => task.estimatedRewards > 0n)

    if (tasksWithRewards.length === 0) {
      setError(new Error('No rewards to claim'))
      return
    }

    setTasks(tasksWithRewards)
    setCurrentTaskIndex(0)
    setIsProcessing(true)
    setError(null)
    setHasTriggeredClaim(false)

    // Reset hooks
    delegationClaimHook.reset()
    coinbaseClaimHook.reset()
  }, [userAddress, buildSplitData, delegationClaimHook, coinbaseClaimHook])

  /**
   * Cancel claiming - stops processing but keeps completed
   */
  const cancelClaiming = useCallback(() => {
    cancelledRef.current = true
    setIsProcessing(false)
    setCurrentTaskIndex(null)
    setHasTriggeredClaim(false)
    delegationClaimHook.reset()
    coinbaseClaimHook.reset()
  }, [delegationClaimHook, coinbaseClaimHook])

  /**
   * Retry failed tasks
   */
  const retryFailed = useCallback(() => {
    const failedTasks = tasks.filter(t => t.status === 'error')
    if (failedTasks.length === 0) return

    // Reset failed tasks to pending
    setTasks(prev => prev.map(t =>
      t.status === 'error' ? { ...t, status: 'pending' as const, error: undefined } : t
    ))

    // Find first pending task
    const firstPendingIndex = tasks.findIndex(t => t.status === 'pending' || t.status === 'error')
    if (firstPendingIndex !== -1) {
      cancelledRef.current = false
      setCurrentTaskIndex(firstPendingIndex)
      setIsProcessing(true)
      setError(null)
      setHasTriggeredClaim(false)
    }
  }, [tasks])

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    cancelledRef.current = false
    setTasks([])
    setCurrentTaskIndex(null)
    setIsProcessing(false)
    setError(null)
    setHasTriggeredClaim(false)
    delegationClaimHook.reset()
    coinbaseClaimHook.reset()
  }, [delegationClaimHook, coinbaseClaimHook])

  /**
   * Start claim for current task when ready
   */
  useEffect(() => {
    if (!isProcessing || currentTaskIndex === null || hasTriggeredClaim || cancelledRef.current) return

    const task = tasks[currentTaskIndex]
    if (!task || task.status !== 'pending') return

    // Wait for balances to load for delegations
    if (task.type === 'delegation' && isLoadingBalances) return

    // Mark task as processing
    setTasks(prev => prev.map((t, i) =>
      i === currentTaskIndex ? { ...t, status: 'processing' as const } : t
    ))
    setHasTriggeredClaim(true)

    // Start the appropriate claim
    if (task.type === 'delegation') {
      delegationClaimHook.claim()
    } else if (task.type === 'coinbase' && task.coinbaseAddress) {
      coinbaseClaimHook.claimRewards(task.coinbaseAddress)
    }
  }, [isProcessing, currentTaskIndex, tasks, hasTriggeredClaim, isLoadingBalances, delegationClaimHook, coinbaseClaimHook])

  /**
   * Update sub-step for delegation tasks
   */
  useEffect(() => {
    if (!currentTask || currentTask.type !== 'delegation' || !isProcessing) return

    const subStep = delegationClaimHook.claimStep
    if (subStep !== 'idle') {
      setTasks(prev => prev.map((t, i) =>
        i === currentTaskIndex ? { ...t, currentSubStep: subStep as 'claiming' | 'distributing' | 'withdrawing' } : t
      ))
    }
  }, [delegationClaimHook.claimStep, currentTaskIndex, currentTask?.type, isProcessing])

  /**
   * Handle task completion and move to next
   */
  useEffect(() => {
    if (!isProcessing || currentTaskIndex === null || !hasTriggeredClaim || cancelledRef.current) return

    const task = tasks[currentTaskIndex]
    if (!task || task.status !== 'processing') return

    let isComplete = false

    // Check completion based on task type
    if (task.type === 'delegation') {
      isComplete = delegationClaimHook.isSuccess && delegationClaimHook.claimStep === 'idle'
    } else if (task.type === 'coinbase') {
      isComplete = coinbaseClaimHook.isSuccess
    }

    if (isComplete) {
      // Mark task as completed
      setTasks(prev => prev.map((t, i) =>
        i === currentTaskIndex ? { ...t, status: 'completed' as const } : t
      ))

      // Reset hooks for next task
      delegationClaimHook.reset()
      coinbaseClaimHook.reset()

      // Small delay before moving to next task
      const timeoutId = setTimeout(() => {
        if (cancelledRef.current) return

        // Move to next task
        const nextIndex = currentTaskIndex + 1
        if (nextIndex < tasks.length) {
          setCurrentTaskIndex(nextIndex)
          setHasTriggeredClaim(false)
        } else {
          // All done
          setIsProcessing(false)
          setCurrentTaskIndex(null)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [
    isProcessing,
    currentTaskIndex,
    tasks,
    hasTriggeredClaim,
    delegationClaimHook.isSuccess,
    delegationClaimHook.claimStep,
    coinbaseClaimHook.isSuccess,
    delegationClaimHook,
    coinbaseClaimHook
  ])

  /**
   * Handle errors
   */
  useEffect(() => {
    if (!isProcessing || currentTaskIndex === null) return

    const task = tasks[currentTaskIndex]
    if (!task || task.status !== 'processing') return

    let taskError: Error | null = null

    if (task.type === 'delegation' && delegationClaimHook.isError) {
      taskError = delegationClaimHook.error as Error
    } else if (task.type === 'coinbase' && coinbaseClaimHook.isError) {
      taskError = coinbaseClaimHook.error as Error
    }

    if (taskError) {
      // Mark task as failed
      setTasks(prev => prev.map((t, i) =>
        i === currentTaskIndex ? { ...t, status: 'error' as const, error: taskError } : t
      ))

      // Stop processing on error
      setIsProcessing(false)
      setError(taskError)
      setHasTriggeredClaim(false)

      // Reset hooks
      delegationClaimHook.reset()
      coinbaseClaimHook.reset()
    }
  }, [
    isProcessing,
    currentTaskIndex,
    tasks,
    delegationClaimHook.isError,
    delegationClaimHook.error,
    coinbaseClaimHook.isError,
    coinbaseClaimHook.error,
    delegationClaimHook,
    coinbaseClaimHook
  ])

  // Calculate progress
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const failedTasks = tasks.filter(t => t.status === 'error')
  const progressPercent = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0

  // Determine overall success/error state
  const isSuccess = tasks.length > 0 && completedTasks.length === tasks.length
  const isError = failedTasks.length > 0

  return {
    startClaiming,
    cancelClaiming,
    retryFailed,
    reset,
    tasks,
    currentTask,
    currentTaskIndex,
    isProcessing,
    progressPercent,
    isSuccess,
    isError,
    error,
    completedTasks,
    failedTasks
  }
}
