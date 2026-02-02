import { useEffect } from 'react'
import type { CartTransaction, TransactionStatus } from '@/contexts/TransactionCartContext'
import { useSafeApp } from '../useSafeApp'

interface UseSafeStatusPollingProps {
  transactions: CartTransaction[]
  setTransactions: React.Dispatch<React.SetStateAction<CartTransaction[]>>
}

/**
 * Polls Safe Transaction Service API to check execution status
 * Updates transactions from 'executing' to 'completed' when Safe tx is executed on-chain
 */
export function useSafeStatusPolling({
  transactions,
  setTransactions
}: UseSafeStatusPollingProps) {
  const { isSafeApp, apiKit } = useSafeApp()

  useEffect(() => {
    if (!isSafeApp || !apiKit) return

    // Find transactions that are executing and have safeTxHash but no txHash yet
    const executingTxs = transactions.filter(
      tx => tx.status === 'executing' && tx.safeTxHash && !tx.txHash
    )

    if (executingTxs.length === 0) return

    const checkStatus = async () => {
      for (const tx of executingTxs) {
        try {
          // Use SafeApiKit to get transaction status
          const safeTransaction = await apiKit.getTransaction(tx.safeTxHash!)

          // Update transaction if executed on-chain
          if (safeTransaction.isExecuted && safeTransaction.transactionHash) {
            setTransactions(prev =>
              prev.map(t =>
                t.id === tx.id
                  ? {
                    ...t,
                    status: 'completed' as TransactionStatus,
                    txHash: safeTransaction.transactionHash!
                  }
                  : t
              )
            )
          }
        } catch (error) {
          console.error('Error checking Safe tx status:', error)
        }
      }
    }

    // Check immediately
    checkStatus()

    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000)

    return () => clearInterval(interval)
  }, [transactions, setTransactions, isSafeApp, apiKit])
}
