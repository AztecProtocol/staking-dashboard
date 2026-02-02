import { useCallback, useState, useEffect } from 'react'
import { useWriteContract as useWagmiWrite, useWaitForTransactionReceipt as useWagmiReceipt } from 'wagmi'
import { encodeFunctionData, type Hex, type Address, type Abi } from 'viem'
import { useSafeApp } from './useSafeApp'
import { useTermsModal } from '@/contexts/TermsModalContext'

interface WriteConfig {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  value?: bigint
}

interface ReceiptOptions {
  hash?: Hex
  confirmations?: number
  timeout?: number
  enabled?: boolean
}

/**
 * Automatic wallet strategy selection hook
 * - Regular wallet: executes transaction immediately via wagmi
 * - Safe wallet: creates proposal that requires approval/execution, and extract the safeTxHash to detect tx completion
 *
 * Usage: Replace wagmi import with this hook (no other changes needed)
 * Before: import { useWriteContract } from "wagmi"
 * After:  import { useWriteContract } from "@/hooks/useWagmiStrategy"
 */
function createUseWriteContract() {
  return function useWriteContract() {
    const { isSafeApp, sdk } = useSafeApp()
    const { requireTermsAcceptance } = useTermsModal()
    const wagmiWrite = useWagmiWrite()
    const [safeTxHash, setSafeTxHash] = useState<Hex | undefined>()
    const [safePending, setSafePending] = useState(false)
    const [safeError, setSafeError] = useState<Error | null>(null)

    const executeSafe = useCallback(async (config: WriteConfig) => {
      if (!sdk) throw new Error('Safe SDK not initialized')

      setSafePending(true)
      setSafeError(null)

      try {
        const txData = encodeFunctionData({
          abi: config.abi,
          functionName: config.functionName,
          args: config.args || []
        })

        const { safeTxHash } = await sdk.txs.send({
          txs: [{
            to: config.address,
            value: (config.value || 0n).toString(),
            data: txData
          }]
        })

        setSafeTxHash(safeTxHash as Hex)
        setSafePending(false)
        return safeTxHash as Hex

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Safe transaction failed')
        setSafeError(err)
        setSafePending(false)
        throw err
      }
    }, [sdk])

    const writeContract = useCallback((config: WriteConfig) => {
      return new Promise((resolve, reject) => {
        requireTermsAcceptance(() => {
          try {
            if (isSafeApp) {
              resolve(executeSafe(config))
            } else {
              resolve(wagmiWrite.writeContract(config))
            }
          } catch (error) {
            reject(error)
          }
        })
      })
    }, [isSafeApp, executeSafe, wagmiWrite, requireTermsAcceptance])

    return {
      writeContract,
      data: isSafeApp ? safeTxHash : wagmiWrite.data,
      error: isSafeApp ? safeError : wagmiWrite.error,
      isPending: isSafeApp ? safePending : wagmiWrite.isPending,
      isError: isSafeApp ? !!safeError : wagmiWrite.isError,
      reset: wagmiWrite.reset
    }
  }
}

/**
 * Automatic transaction receipt strategy hook
 * - Regular wallet: waits for on-chain confirmation via wagmi
 * - Safe wallet: polls Safe API every 3s until transaction is executed
 *
 * Usage: Replace wagmi import with this hook (no other changes needed)
 * Before: import { useWaitForTransactionReceipt } from "wagmi"
 * After:  import { useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
 */
function createUseWaitForTransactionReceipt() {
  return function useWaitForTransactionReceipt(options: ReceiptOptions = {}) {
    const { isSafeApp, apiKit } = useSafeApp()
    const [safeStatus, setSafeStatus] = useState<{
      isLoading: boolean
      isSuccess: boolean
      isError: boolean
      error: Error | null
      transactionHash?: Hex
    }>({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null
    })

    const wagmiReceipt = useWagmiReceipt({
      hash: options.hash,
      confirmations: options.confirmations,
      query: {
        enabled: !isSafeApp && (options.enabled ?? !!options.hash)
      }
    })

    useEffect(() => {
      if (!isSafeApp || !apiKit || !options.hash) return

      setSafeStatus(prev => ({ ...prev, isLoading: true }))

      const pollInterval = setInterval(async () => {
        try {
          const safeTx = await apiKit.getTransaction(options.hash!)

          if (safeTx.isExecuted && safeTx.transactionHash) {
            setSafeStatus({
              isLoading: false,
              isSuccess: true,
              isError: false,
              error: null,
              transactionHash: safeTx.transactionHash as Hex
            })
            clearInterval(pollInterval)
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Failed to check Safe transaction status')
          setSafeStatus({
            isLoading: false,
            isSuccess: false,
            isError: true,
            error: err,
            transactionHash: undefined
          })
          clearInterval(pollInterval)
        }
      }, 3000)

      return () => clearInterval(pollInterval)
    }, [isSafeApp, apiKit, options.hash])

    if (isSafeApp) {
      return safeStatus
    }

    return wagmiReceipt
  }
}

export const useWriteContract = createUseWriteContract()
export const useWaitForTransactionReceipt = createUseWaitForTransactionReceipt()
