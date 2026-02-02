import { useEffect } from "react"
import type { PublicClient } from "viem"
import type { CartTransaction, TransactionStatus } from "@/contexts/TransactionCartContext"

/**
 * Hook to resume tracking executing transactions after page refresh
 */
export function useTransactionTracking(
  publicClient: PublicClient | undefined,
  transactions: CartTransaction[],
  setTransactions: React.Dispatch<React.SetStateAction<CartTransaction[]>>,
  currentExecutingId: string | null,
  setCurrentExecutingId: React.Dispatch<React.SetStateAction<string | null>>,
  isExecuting: boolean
) {
  useEffect(() => {
    if (!publicClient) return

    const executingTxs = transactions.filter(tx =>
      tx.status === 'executing' && tx.txHash
    )

    if (executingTxs.length === 0) return

    // Track each executing transaction
    executingTxs.forEach(async (tx) => {
      try {
        await publicClient.waitForTransactionReceipt({ hash: tx.txHash! as `0x${string}` })

        // Mark as completed
        setTransactions(prev => prev.map(t =>
          t.id === tx.id
            ? { ...t, status: 'completed' as TransactionStatus }
            : t
        ))

        // Clear currentExecutingId only if not actively executing (i.e., after page refresh)
        if (!isExecuting && currentExecutingId === tx.id) {
          setCurrentExecutingId(null)
        }
      } catch (error) {
        // Mark as failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setTransactions(prev => prev.map(t =>
          t.id === tx.id
            ? { ...t, status: 'failed' as TransactionStatus, error: errorMessage }
            : t
        ))

        // Clear currentExecutingId only if not actively executing (i.e., after page refresh)
        if (!isExecuting && currentExecutingId === tx.id) {
          setCurrentExecutingId(null)
        }
      }
    })
  }, [publicClient, transactions, setTransactions, currentExecutingId, setCurrentExecutingId, isExecuting])
}
