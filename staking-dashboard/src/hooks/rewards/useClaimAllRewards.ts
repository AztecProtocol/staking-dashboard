import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
  /**
   * The rollup contract this task targets. Coinbase tasks pulled from a multi-rollup
   * breakdown carry the rollup the balance lives on so the engine routes the
   * `claimSequencerRewards` call to the correct contract. Delegation tasks default to
   * the configured rollup (delegation rewards are split-contract scoped, but the
   * underlying balance still flows from a specific rollup).
   */
  rollupAddress?: Address
  rollupVersion?: bigint
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
  // Ref-based timeout for advancing between tasks — survives effect re-runs
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get current task
  const currentTask = currentTaskIndex !== null ? tasks[currentTaskIndex] : null

  // Get current task's addresses
  const currentSplitContract = currentTask?.type === 'delegation' ? currentTask.splitContract : undefined
  const currentCoinbase = currentTask?.type === 'coinbase' ? currentTask.coinbaseAddress : undefined
  // Each task carries the rollup the balance lives on. For delegation tasks (which have not
  // been multi-rollup-expanded yet) and legacy callers that omit the field, fall back to the
  // configured rollup so existing behavior is preserved.
  const currentTaskRollup = currentTask?.rollupAddress

  // Fetch balances for current task (for delegations) - extract refetch functions
  const { warehouseAddress, isLoading: isLoadingWarehouse } = useSplitsWarehouse(currentSplitContract)
  const { rewards: rollupBalance, isLoading: isLoadingRollup, refetch: refetchRollup } = useSequencerRewards(currentSplitContract || currentCoinbase || '', currentTaskRollup)
  const { balance: splitContractBalance, isLoading: isLoadingSplitBalance, refetch: refetchSplitContract } = useERC20Balance(tokenAddress, currentSplitContract)
  const { balance: warehouseBalance, isLoading: isLoadingWarehouseBalance, refetch: refetchWarehouse } = useWarehouseBalance(warehouseAddress, userAddress, tokenAddress)

  const isLoadingBalances = currentTask?.type === 'delegation'
    ? (isLoadingWarehouse || isLoadingRollup || isLoadingSplitBalance || isLoadingWarehouseBalance)
    : isLoadingRollup

  // Memoize balances object to prevent effect re-runs on every render
  const balances = useMemo(() => ({
    rollupBalance,
    splitContractBalance,
    warehouseBalance,
    refetchRollup,
    refetchSplitContract,
    refetchWarehouse
  }), [rollupBalance, splitContractBalance, warehouseBalance, refetchRollup, refetchSplitContract, refetchWarehouse])

  // Use existing hooks for claiming
  const delegationClaimHook = useClaimSplitRewards(
    currentSplitContract,
    currentTask?.splitData || { recipients: [], allocations: [], totalAllocation: 0n, distributionIncentive: 0 },
    tokenAddress,
    userAddress,
    balances
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
        // Include the rollup in the task id so the same coinbase address claimed across
        // multiple rollups produces distinct tasks instead of collapsing into one.
        id: `coinbase-${coinbase.address}-${coinbase.rollupAddress}`,
        type: 'coinbase',
        displayName: coinbase.rollupVersion !== undefined
          ? `${coinbase.address.slice(0, 6)}...${coinbase.address.slice(-4)} (rollup v${coinbase.rollupVersion})`
          : `${coinbase.address.slice(0, 6)}...${coinbase.address.slice(-4)}`,
        estimatedRewards: coinbase.rewards,
        status: 'pending',
        coinbaseAddress: coinbase.address,
        rollupAddress: coinbase.rollupAddress,
        rollupVersion: coinbase.rollupVersion,
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
    handledCompletionRef.current = null

    // Reset hooks
    delegationClaimHook.reset()
    coinbaseClaimHook.reset()
  }, [userAddress, buildSplitData, delegationClaimHook, coinbaseClaimHook])

  /**
   * Cancel claiming - stops processing but keeps completed
   */
  const cancelClaiming = useCallback(() => {
    cancelledRef.current = true
    if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null }
    handledCompletionRef.current = null
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
    if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null }
    handledCompletionRef.current = null
    setTasks([])
    setCurrentTaskIndex(null)
    setIsProcessing(false)
    setError(null)
    setHasTriggeredClaim(false)
    delegationClaimHook.reset()
    coinbaseClaimHook.reset()
  }, [delegationClaimHook, coinbaseClaimHook])

  // Keep stable refs to claim functions so the trigger effect doesn't re-fire
  // when the hook objects change identity (e.g. after reset()).
  const delegationClaimRef = useRef(delegationClaimHook)
  delegationClaimRef.current = delegationClaimHook
  const coinbaseClaimRef = useRef(coinbaseClaimHook)
  coinbaseClaimRef.current = coinbaseClaimHook

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

    // Start the appropriate claim (read from refs to avoid stale closures)
    if (task.type === 'delegation') {
      delegationClaimRef.current.claim()
    } else if (task.type === 'coinbase' && task.coinbaseAddress) {
      // Pass the per-task rollup address so the claim lands on the correct rollup contract
      // (the hook itself defaults to the configured rollup when no override is given).
      coinbaseClaimRef.current.claimRewards(task.coinbaseAddress, task.rollupAddress)
    }
  }, [isProcessing, currentTaskIndex, tasks, hasTriggeredClaim, isLoadingBalances])

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

  // Track whether we've already handled the current task's completion to avoid
  // re-processing when hook state oscillates during reset.
  const handledCompletionRef = useRef<number | null>(null)

  /**
   * Handle task completion and move to next
   */
  useEffect(() => {
    if (!isProcessing || currentTaskIndex === null || !hasTriggeredClaim || cancelledRef.current) return
    if (handledCompletionRef.current === currentTaskIndex) return

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
      // Guard against re-entry
      handledCompletionRef.current = currentTaskIndex

      // Mark task as completed
      setTasks(prev => prev.map((t, i) =>
        i === currentTaskIndex ? { ...t, status: 'completed' as const } : t
      ))

      // Reset hooks and advance to next task after a small delay.
      // Use a ref-based timeout so it survives effect re-runs — the setTasks()
      // above changes `tasks`, which re-triggers this effect. A cleanup return
      // would kill the timeout before it fires.
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = setTimeout(() => {
        advanceTimeoutRef.current = null
        if (cancelledRef.current) return

        delegationClaimRef.current.reset()
        coinbaseClaimRef.current.reset()

        const nextIndex = currentTaskIndex + 1
        if (nextIndex < tasks.length) {
          setCurrentTaskIndex(nextIndex)
          setHasTriggeredClaim(false)
          handledCompletionRef.current = null
        } else {
          setIsProcessing(false)
          setCurrentTaskIndex(null)
          handledCompletionRef.current = null
        }
      }, 500)
    }
  }, [
    isProcessing,
    currentTaskIndex,
    tasks,
    hasTriggeredClaim,
    delegationClaimHook.isSuccess,
    delegationClaimHook.claimStep,
    coinbaseClaimHook.isSuccess,
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
      delegationClaimRef.current.reset()
      coinbaseClaimRef.current.reset()
    }
  }, [
    isProcessing,
    currentTaskIndex,
    tasks,
    delegationClaimHook.isError,
    delegationClaimHook.error,
    coinbaseClaimHook.isError,
    coinbaseClaimHook.error,
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
