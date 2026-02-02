import { useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { encodePacked, encodeFunctionData, concat, type Address } from 'viem'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'
import type { RawTransaction } from '@/contexts/TransactionCartContext'
import { useSafeApp } from '../useSafeApp'

interface SimulationResult {
  success: boolean
  safeTxGas?: string
  error?: string
}

/**
 * Hook for simulating Safe transactions before execution
 * Uses Safe API Kit to validate transactions
 */
export function useSafeSimulation() {
  const { address: safeAddress } = useAccount()
  const { apiKit } = useSafeApp()
  const chainId = useChainId()

  /**
   * Simulate a batch of transactions
   */
  const simulateBatchTransaction = useCallback(async (transactions: RawTransaction[]): Promise<SimulationResult> => {
    if (!safeAddress) {
      return { success: false, error: 'No Safe address connected' }
    }

    if (!apiKit) {
      return { success: false, error: 'Safe API Kit not initialized' }
    }

    if (transactions.length === 0) {
      return { success: false, error: 'No transactions to simulate' }
    }

    try {
      // For single transaction, simulate directly
      if (transactions.length === 1) {
        const safeTransactionData = {
          to: transactions[0].to,
          value: transactions[0].value.toString(),
          data: transactions[0].data,
          operation: 0 // CALL
        }

        const estimation = await apiKit.estimateSafeTransaction(
          safeAddress,
          safeTransactionData
        )

        return {
          success: true,
          safeTxGas: estimation.safeTxGas
        }
      }

      // For multiple transactions, encode as MultiSend batch
      const multiSendDeployment = getMultiSendCallOnlyDeployment({ network: chainId.toString() })

      console.log(multiSendDeployment)

      if (!multiSendDeployment) {
        return { success: false, error: 'MultiSend contract not available for this network' }
      }

      const multiSendAddress = multiSendDeployment.defaultAddress as Address

      // Encode each transaction: operation (1 byte) + to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data
      const encodedTransactions = transactions.map(tx => {
        const dataLength = BigInt((tx.data.length - 2) / 2) // Remove '0x' and get byte length
        return encodePacked(
          ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
          [0, tx.to, tx.value, dataLength, tx.data]
        )
      })

      // Concatenate all encoded transactions
      const multiSendData = concat(encodedTransactions)

      // Encode the multiSend call
      const multiSendCallData = encodeFunctionData({
        abi: [{
          name: 'multiSend',
          type: 'function',
          inputs: [{ name: 'transactions', type: 'bytes' }],
          outputs: []
        }],
        functionName: 'multiSend',
        args: [multiSendData]
      })

      // Simulate the batch transaction
      const safeTransactionData = {
        to: multiSendAddress,
        value: '0',
        data: multiSendCallData,
        operation: 1 // DELEGATECALL for MultiSend
      }

      const estimation = await apiKit.estimateSafeTransaction(
        safeAddress,
        safeTransactionData
      )

      return {
        success: true,
        safeTxGas: estimation.safeTxGas
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown simulation error'
      return { success: false, error: errorMessage }
    }
  }, [safeAddress, apiKit, chainId])

  /**
   * Simulate a single transaction
   */
  const simulateTransaction = useCallback(async (transaction: RawTransaction): Promise<SimulationResult> => {
    return simulateBatchTransaction([transaction])
  }, [simulateBatchTransaction])

  return { simulateTransaction, simulateBatchTransaction }
}
