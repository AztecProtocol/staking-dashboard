import { useEffect, useCallback, useRef, useMemo, useReducer } from "react"
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

// ── Types ──────────────────────────────────────────────────────────────

export type ClaimTaskStatus = 'pending' | 'processing' | 'completed' | 'error' | 'skipped'
export type ClaimTaskType = 'delegation' | 'coinbase'

export interface ClaimTask {
  id: string
  type: ClaimTaskType
  displayName: string
  estimatedRewards: bigint
  status: ClaimTaskStatus
  error?: Error
  splitContract?: Address
  splitData?: SplitData
  providerTakeRate?: number
  coinbaseAddress?: Address
  /** Rollup contract this task targets for claiming. */
  rollupAddress?: Address
  rollupVersion?: bigint
  currentSubStep?: 'claiming' | 'distributing' | 'withdrawing'
}

// ── State machine ──────────────────────────────────────────────────────

type Phase = 'idle' | 'ready_to_trigger' | 'waiting_for_result' | 'advancing'

interface EngineState {
  tasks: ClaimTask[]
  currentIndex: number | null
  phase: Phase
  error: Error | null
}

type Action =
  | { type: 'START'; tasks: ClaimTask[] }
  | { type: 'TRIGGERED' }
  | { type: 'TASK_COMPLETED' }
  | { type: 'TASK_FAILED'; error: Error }
  | { type: 'UPDATE_SUBSTEP'; subStep: string }
  | { type: 'ADVANCED' }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'RETRY' }

const initialState: EngineState = {
  tasks: [],
  currentIndex: null,
  phase: 'idle',
  error: null,
}

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'START':
      return { tasks: action.tasks, currentIndex: 0, phase: 'ready_to_trigger', error: null }

    case 'TRIGGERED':
      return {
        ...state,
        phase: 'waiting_for_result',
        tasks: state.tasks.map((t, i) =>
          i === state.currentIndex ? { ...t, status: 'processing' as const } : t
        ),
      }

    case 'TASK_COMPLETED':
      return {
        ...state,
        phase: 'advancing',
        tasks: state.tasks.map((t, i) =>
          i === state.currentIndex ? { ...t, status: 'completed' as const } : t
        ),
      }

    case 'TASK_FAILED':
      return {
        ...state,
        phase: 'advancing',
        error: action.error,
        tasks: state.tasks.map((t, i) =>
          i === state.currentIndex ? { ...t, status: 'error' as const, error: action.error } : t
        ),
      }

    case 'UPDATE_SUBSTEP':
      return {
        ...state,
        tasks: state.tasks.map((t, i) =>
          i === state.currentIndex
            ? { ...t, currentSubStep: action.subStep as ClaimTask['currentSubStep'] }
            : t
        ),
      }

    case 'ADVANCED': {
      const nextIndex = state.currentIndex! + 1
      if (nextIndex < state.tasks.length) {
        return { ...state, currentIndex: nextIndex, phase: 'ready_to_trigger' }
      }
      return { ...state, currentIndex: null, phase: 'idle' }
    }

    case 'CANCEL':
      return { ...state, currentIndex: null, phase: 'idle' }

    case 'RESET':
      return initialState

    case 'RETRY': {
      const retried = state.tasks.map(t =>
        t.status === 'error' ? { ...t, status: 'pending' as const, error: undefined } : t
      )
      const firstPending = retried.findIndex(t => t.status === 'pending')
      if (firstPending === -1) return state
      return { tasks: retried, currentIndex: firstPending, phase: 'ready_to_trigger', error: null }
    }

    default:
      return state
  }
}

// ── Return type ────────────────────────────────────────────────────────

interface UseClaimAllRewardsReturn {
  startClaiming: (delegations: DelegationBreakdown[], coinbases: CoinbaseBreakdown[]) => void
  cancelClaiming: () => void
  retryFailed: () => void
  reset: () => void
  tasks: ClaimTask[]
  currentTask: ClaimTask | null
  currentTaskIndex: number | null
  isProcessing: boolean
  progressPercent: number
  isSuccess: boolean
  isError: boolean
  error: Error | null
  completedTasks: ClaimTask[]
  failedTasks: ClaimTask[]
}

// ── Hook ───────────────────────────────────────────────────────────────

export const useClaimAllRewards = (): UseClaimAllRewardsReturn => {
  const { address: userAddress } = useAccount()
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  const [state, dispatch] = useReducer(reducer, initialState)
  const currentTask = state.currentIndex !== null ? state.tasks[state.currentIndex] : null

  // ── Delegation balance hooks (driven by currentTask) ─────────────
  const currentSplitContract = currentTask?.type === 'delegation' ? currentTask.splitContract : undefined
  const currentCoinbase = currentTask?.type === 'coinbase' ? currentTask.coinbaseAddress : undefined
  const currentTaskRollup = currentTask?.rollupAddress

  const { warehouseAddress, isLoading: isLoadingWarehouse } = useSplitsWarehouse(currentSplitContract)
  const { rewards: rollupBalance, isLoading: isLoadingRollup, refetch: refetchRollup } =
    useSequencerRewards(currentSplitContract || currentCoinbase || '', currentTaskRollup)
  const { balance: splitContractBalance, isLoading: isLoadingSplitBalance, refetch: refetchSplitContract } =
    useERC20Balance(tokenAddress, currentSplitContract)
  const { balance: warehouseBalance, isLoading: isLoadingWarehouseBalance, refetch: refetchWarehouse } =
    useWarehouseBalance(warehouseAddress, userAddress, tokenAddress)

  const isLoadingBalances = currentTask?.type === 'delegation'
    ? (isLoadingWarehouse || isLoadingRollup || isLoadingSplitBalance || isLoadingWarehouseBalance)
    : isLoadingRollup

  const balances = useMemo(() => ({
    rollupBalance, splitContractBalance, warehouseBalance,
    refetchRollup, refetchSplitContract, refetchWarehouse
  }), [rollupBalance, splitContractBalance, warehouseBalance, refetchRollup, refetchSplitContract, refetchWarehouse])

  // ── Claim hooks ──────────────────────────────────────────────────
  const delegationClaimHook = useClaimSplitRewards(
    currentSplitContract,
    currentTask?.splitData || { recipients: [], allocations: [], totalAllocation: 0n, distributionIncentive: 0 },
    tokenAddress, userAddress, balances
  )
  const coinbaseClaimHook = useClaimSequencerRewards()

  // Stable refs for calling inside effects without dep issues
  const delegationRef = useRef(delegationClaimHook)
  delegationRef.current = delegationClaimHook
  const coinbaseRef = useRef(coinbaseClaimHook)
  coinbaseRef.current = coinbaseClaimHook

  // ── Effect 1: TRIGGER — start the claim for the current task ─────
  useEffect(() => {
    if (state.phase !== 'ready_to_trigger' || state.currentIndex === null) return
    const task = state.tasks[state.currentIndex]
    if (!task) return
    if (task.type === 'delegation' && isLoadingBalances) return

    dispatch({ type: 'TRIGGERED' })

    if (task.type === 'delegation') {
      delegationRef.current.claim()
    } else if (task.type === 'coinbase' && task.coinbaseAddress) {
      coinbaseRef.current.claimRewards(task.coinbaseAddress, task.rollupAddress)
    }
  }, [state.phase, state.currentIndex, state.tasks, isLoadingBalances])

  // ── Effect 2: RESULT — watch hooks for success or error ──────────
  useEffect(() => {
    if (state.phase !== 'waiting_for_result' || !currentTask) return

    const isSuccess = currentTask.type === 'delegation'
      ? delegationClaimHook.isSuccess && delegationClaimHook.claimStep === 'idle'
      : coinbaseClaimHook.isSuccess

    const isError = currentTask.type === 'delegation'
      ? delegationClaimHook.isError
      : coinbaseClaimHook.isError

    const hookError = currentTask.type === 'delegation'
      ? delegationClaimHook.error
      : coinbaseClaimHook.error

    if (isSuccess) {
      dispatch({ type: 'TASK_COMPLETED' })
    } else if (isError && hookError) {
      dispatch({ type: 'TASK_FAILED', error: hookError as Error })
    }
  }, [
    state.phase, currentTask,
    delegationClaimHook.isSuccess, delegationClaimHook.isError,
    delegationClaimHook.error, delegationClaimHook.claimStep,
    coinbaseClaimHook.isSuccess, coinbaseClaimHook.isError, coinbaseClaimHook.error,
  ])

  // ── Effect 3: ADVANCE — delay, reset hooks, move to next task ────
  useEffect(() => {
    if (state.phase !== 'advancing') return

    const timeout = setTimeout(() => {
      delegationRef.current.reset()
      coinbaseRef.current.reset()
      dispatch({ type: 'ADVANCED' })
    }, 500)

    return () => clearTimeout(timeout)
  }, [state.phase])

  // ── Effect 4: SUBSTEP — update delegation sub-step display ───────
  useEffect(() => {
    if (state.phase !== 'waiting_for_result') return
    if (!currentTask || currentTask.type !== 'delegation') return

    const subStep = delegationClaimHook.claimStep
    if (subStep !== 'idle') {
      dispatch({ type: 'UPDATE_SUBSTEP', subStep })
    }
  }, [state.phase, currentTask, delegationClaimHook.claimStep])

  // ── Actions ──────────────────────────────────────────────────────

  const buildSplitData = useCallback((delegation: DelegationBreakdown, user: Address): SplitData => {
    const totalAllocation = 10000n
    const providerAllocation = BigInt(delegation.providerTakeRate)
    return {
      recipients: [delegation.providerRewardsRecipient as Address, user],
      allocations: [providerAllocation, totalAllocation - providerAllocation],
      totalAllocation,
      distributionIncentive: 0
    }
  }, [])

  const resetHooks = useCallback(() => {
    delegationRef.current.reset()
    coinbaseRef.current.reset()
  }, [])

  const startClaiming = useCallback((delegations: DelegationBreakdown[], coinbases: CoinbaseBreakdown[]) => {
    if (!userAddress || (!delegations.length && !coinbases.length)) return

    const newTasks: ClaimTask[] = [
      ...delegations.map((d): ClaimTask => ({
        id: `delegation-${d.splitContract}`,
        type: 'delegation',
        displayName: d.providerName || `Provider ${d.providerId}`,
        estimatedRewards: d.rewards,
        status: 'pending',
        splitContract: d.splitContract as Address,
        splitData: buildSplitData(d, userAddress),
        providerTakeRate: d.providerTakeRate
      })),
      ...coinbases.map((c): ClaimTask => ({
        id: `coinbase-${c.address}-${c.rollupAddress}`,
        type: 'coinbase',
        displayName: c.rollupVersion !== undefined
          ? `${c.address.slice(0, 6)}...${c.address.slice(-4)} (rollup v${c.rollupVersion})`
          : `${c.address.slice(0, 6)}...${c.address.slice(-4)}`,
        estimatedRewards: c.rewards,
        status: 'pending',
        coinbaseAddress: c.address,
        rollupAddress: c.rollupAddress,
        rollupVersion: c.rollupVersion,
      }))
    ].filter(t => t.estimatedRewards > 0n)

    if (newTasks.length === 0) return

    resetHooks()
    dispatch({ type: 'START', tasks: newTasks })
  }, [userAddress, buildSplitData, resetHooks])

  const cancelClaiming = useCallback(() => {
    resetHooks()
    dispatch({ type: 'CANCEL' })
  }, [resetHooks])

  const retryFailed = useCallback(() => {
    resetHooks()
    dispatch({ type: 'RETRY' })
  }, [resetHooks])

  const reset = useCallback(() => {
    resetHooks()
    dispatch({ type: 'RESET' })
  }, [resetHooks])

  // ── Derived state ────────────────────────────────────────────────

  const completedTasks = state.tasks.filter(t => t.status === 'completed')
  const failedTasks = state.tasks.filter(t => t.status === 'error')
  const doneTasks = completedTasks.length + failedTasks.length
  const isProcessing = state.phase !== 'idle'
  const isAllDone = state.tasks.length > 0 && !isProcessing && doneTasks === state.tasks.length

  return {
    startClaiming,
    cancelClaiming,
    retryFailed,
    reset,
    tasks: state.tasks,
    currentTask,
    currentTaskIndex: state.currentIndex,
    isProcessing,
    progressPercent: state.tasks.length > 0 ? Math.round((doneTasks / state.tasks.length) * 100) : 0,
    isSuccess: isAllDone && completedTasks.length > 0,
    isError: isAllDone && failedTasks.length > 0,
    error: state.error,
    completedTasks,
    failedTasks,
  }
}
