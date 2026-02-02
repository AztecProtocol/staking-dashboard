import { useState, useEffect } from "react"
import { useDistributeRewards } from "./useDistributeRewards"
import { useWithdrawRewards } from "./useWithdrawRewards"
import { useSplitsWarehouse } from "./useSplitsWarehouse"
import { useClaimSequencerRewards } from "@/hooks/rollup/useClaimSequencerRewards"
import type { Address } from "viem"
import type { SplitData, ClaimStep } from "./types"

interface BalanceData {
  rollupBalance?: bigint
  splitContractBalance?: bigint
  warehouseBalance?: bigint
}

type QueueStep = 'claiming' | 'distributing' | 'withdrawing'

/**
 * Hook to manage the complete claim flow for split contract rewards
 * Sequential flow: claim from rollup → distribute to warehouse → withdraw to user
 * Skips steps with zero balances
 */
export const useClaimSplitRewards = (
  splitContractAddress: Address | undefined,
  splitData: SplitData,
  tokenAddress: Address | undefined,
  userAddress: Address | undefined,
  balances?: BalanceData
) => {
  const [queue, setQueue] = useState<QueueStep[]>([])
  const [claimStep, setClaimStep] = useState<ClaimStep>('idle')
  const [skipMessage, setSkipMessage] = useState<string | null>(null)
  const [completedMessage, setCompletedMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get warehouse address from split contract
  const { warehouseAddress, isLoading: isLoadingWarehouse } = useSplitsWarehouse(splitContractAddress)

  const claimHook = useClaimSequencerRewards()
  const distributeHook = useDistributeRewards(splitContractAddress)
  const withdrawHook = useWithdrawRewards(warehouseAddress)

  /**
   * Queue processor - processes first item in queue
   */
  useEffect(() => {
    if (queue.length === 0) {
      setClaimStep('idle')
      return
    }

    if (isProcessing) return

    const currentStep = queue[0]
    setClaimStep(currentStep as ClaimStep)

    // CLAIMING
    if (currentStep === 'claiming') {
      const balance = balances?.rollupBalance
      // Wait for balance to load before processing
      if (balance === undefined) return

      if (balance === 0n) {
        setSkipMessage('No rewards to claim from rollup')
        setTimeout(() => {
          setSkipMessage(null)
          setQueue(prev => prev.filter(step => step !== 'claiming'))
        }, 1000)
      } else if (splitContractAddress) {
        setIsProcessing(true)
        claimHook.claimRewards(splitContractAddress)
      }
      return
    }

    // DISTRIBUTING
    if (currentStep === 'distributing') {
      const balance = balances?.splitContractBalance
      // Wait for balance to load before processing
      if (balance === undefined) return

      if (balance === 0n) {
        setSkipMessage('No rewards to distribute')
        setTimeout(() => {
          setSkipMessage(null)
          setQueue(prev => prev.filter(step => step !== 'distributing'))
        }, 1000)
      } else if (tokenAddress) {
        setIsProcessing(true)
        distributeHook.distribute(splitData, tokenAddress)
      }
      return
    }

    // WITHDRAWING
    if (currentStep === 'withdrawing') {
      const balance = balances?.warehouseBalance
      // Wait for balance to load before processing
      if (balance === undefined) return

      if (balance === 0n) {
        setSkipMessage('No rewards to withdraw')
        setTimeout(() => {
          setSkipMessage(null)
          setQueue(prev => prev.filter(step => step !== 'withdrawing'))
        }, 1000)
      } else if (userAddress && tokenAddress) {
        setIsProcessing(true)
        withdrawHook.withdraw(userAddress, tokenAddress)
      }
      return
    }
  }, [queue, balances])

  // Handle transaction success - show completion message then remove from queue
  useEffect(() => {
    if (!isProcessing || queue.length === 0) return

    const currentStep = queue[0]
    let stepCompleted = false
    let message = ''
    let stepToRemove: QueueStep | null = null

    if (currentStep === 'claiming' && claimHook.isSuccess) {
      stepCompleted = true
      message = 'Claimed successfully'
      stepToRemove = 'claiming'
    } else if (currentStep === 'distributing' && distributeHook.isSuccess) {
      stepCompleted = true
      message = 'Distributed successfully'
      stepToRemove = 'distributing'
    } else if (currentStep === 'withdrawing' && withdrawHook.isSuccess) {
      stepCompleted = true
      message = 'Withdrawn successfully'
      stepToRemove = 'withdrawing'
    }

    if (stepCompleted && stepToRemove) {
      setCompletedMessage(message)
      setTimeout(() => {
        setCompletedMessage(null)
        setIsProcessing(false)
        setQueue(prev => prev.filter(step => step !== stepToRemove))
      }, 1000)
    }
  }, [queue, claimHook.isSuccess, distributeHook.isSuccess, withdrawHook.isSuccess, isProcessing])

  // Handle errors - reset queue
  useEffect(() => {
    if (claimHook.isError || distributeHook.isError || withdrawHook.isError) {
      setSkipMessage(null)
      setQueue([])
      setClaimStep('idle')
      setIsProcessing(false)
      claimHook.reset()
      distributeHook.reset()
      withdrawHook.reset()
    }
  }, [claimHook.isError, distributeHook.isError, withdrawHook.isError])

  const claim = () => {
    if (!warehouseAddress) return
    setSkipMessage(null)
    setIsProcessing(false)
    setQueue(['claiming', 'distributing', 'withdrawing'])
  }

  const isClaiming = queue.length > 0
  const isSuccess = queue.length === 0 && withdrawHook.isSuccess

  return {
    claim,
    claimStep,
    skipMessage,
    completedMessage,
    warehouseAddress,
    isLoading: isLoadingWarehouse,
    isClaiming,
    isSuccess,
    isError: claimHook.isError || distributeHook.isError || withdrawHook.isError,
    error: claimHook.error || distributeHook.error || withdrawHook.error,
    claimTxHash: claimHook.txHash,
    distributeTxHash: distributeHook.txHash,
    withdrawTxHash: withdrawHook.txHash,
    reset: () => {
      setQueue([])
      setClaimStep('idle')
      setSkipMessage(null)
      setCompletedMessage(null)
      setIsProcessing(false)
      claimHook.reset()
      distributeHook.reset()
      withdrawHook.reset()
    }
  }
}
