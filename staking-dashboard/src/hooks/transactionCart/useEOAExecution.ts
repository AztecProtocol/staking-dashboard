import { useCallback } from "react"
import { useWalletClient, usePublicClient } from "wagmi"
import type { CartTransaction, TransactionStatus } from "@/contexts/TransactionCartContext"
import { isUserRejection } from "@/utils/transactionCart"
import { useAlert } from "@/contexts/AlertContext"

interface UseEOAExecutionProps {
  setTransactions: React.Dispatch<React.SetStateAction<CartTransaction[]>>
  setCurrentExecutingId: React.Dispatch<React.SetStateAction<string | null>>
}

/**
 * Hook for executing transactions with EOA wallets (sequential)
 */
export function useEOAExecution({
  setTransactions,
  setCurrentExecutingId
}: UseEOAExecutionProps) {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { showAlert } = useAlert()

  const executeTransactions = useCallback(async (pendingTransactions: CartTransaction[], allTransactions: CartTransaction[]) => {
    if (!walletClient || !publicClient) return

    // Check if there are any transactions currently being tracked
    const hasExecutingTx = allTransactions.some(tx => tx.status === 'executing' && tx.txHash)
    if (hasExecutingTx) {
      showAlert("info", "Please wait for the current transaction to complete")
      return
    }

    for (const tx of pendingTransactions) {
      setCurrentExecutingId(tx.id)

      try {
        // Mark as executing
        setTransactions(prev => prev.map(t =>
          t.id === tx.id ? { ...t, status: 'executing' as TransactionStatus } : t
        ))

        let hash: `0x${string}`

        if (tx.txHash) {
          hash = tx.txHash as `0x${string}`
        } else {
          // Send transaction using raw transaction data
          hash = await walletClient.sendTransaction({
            to: tx.transaction.to,
            data: tx.transaction.data,
            value: tx.transaction.value,
          })

          // Store hash immediately after sending (before waiting for receipt)
          setTransactions(prev => prev.map(t =>
            t.id === tx.id ? { ...t, txHash: hash } : t
          ))
        }

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash })

        // Mark as completed with transaction hash
        setTransactions(prev => prev.map(t =>
          t.id === tx.id
            ? { ...t, status: 'completed' as TransactionStatus, txHash: hash }
            : t
        ))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (isUserRejection(errorMessage)) {
          // Reset to pending if user rejected
          setTransactions(prev => prev.map(t =>
            t.id === tx.id ? { ...t, status: 'pending' as TransactionStatus } : t
          ))
          throw new Error(`User rejected transaction: "${tx.label}"`)
        } else {
          // Mark as failed with error for actual failures
          setTransactions(prev => prev.map(t =>
            t.id === tx.id
              ? { ...t, status: 'failed' as TransactionStatus, error: errorMessage }
              : t
          ))
          throw error
        }
      }
    }

    showAlert("success", "All transactions executed successfully")
  }, [walletClient, publicClient, setTransactions, setCurrentExecutingId, showAlert])

  return { executeTransactions }
}
