import { useCallback } from "react"
import type { BaseTransaction } from "@safe-global/safe-apps-sdk"
import type { CartTransaction, TransactionStatus } from "@/contexts/TransactionCartContext"
import { isUserRejection } from "@/utils/transactionCart"
import { useAlert } from "@/contexts/AlertContext"
import { useSafeApp } from "../useSafeApp"
import { useSafeSimulation } from "./useSafeSimulation"

interface UseSafeExecutionProps {
  setTransactions: React.Dispatch<React.SetStateAction<CartTransaction[]>>
}

/**
 * Hook for executing transactions with Safe (Gnosis Safe) wallets (batch)
 */
export function useSafeExecution({
  setTransactions
}: UseSafeExecutionProps) {
  const { sdk: safeSDK } = useSafeApp()
  const { showAlert } = useAlert()
  const { simulateBatchTransaction } = useSafeSimulation()
  const executeTransactions = useCallback(async (pendingTransactions: CartTransaction[], allTransactions: CartTransaction[]) => {
    // Check if there are any transactions currently being tracked (either with txHash or safeTxHash)
    const hasExecutingTx = allTransactions.some(tx =>
      tx.status === 'executing' && (tx.txHash || tx.safeTxHash)
    )
    if (hasExecutingTx) {
      showAlert("info", "Please wait for the current transaction to complete")
      return
    }

    if (!safeSDK) {
      showAlert("error", "Safe SDK not initialized")
      return
    }

    // Simulate batch transaction before executing
    showAlert("info", "Simulating batch transaction...")
    const rawTransactions = pendingTransactions.map(tx => tx.transaction)
    const simulationResult = await simulateBatchTransaction(rawTransactions)

    if (!simulationResult.success) {
      showAlert("error", `Batch transaction simulation failed: ${simulationResult.error || 'Unknown error'}. Check the transaction order - transactions must be arranged correctly for batch execution.`)
      return
    }

    // Mark all as executing before sending to Safe
    setTransactions(prev => prev.map(tx =>
      pendingTransactions.some(ptx => ptx.id === tx.id)
        ? { ...tx, status: 'executing' as TransactionStatus }
        : tx
    ))

    try {
      // Batch execution for Gnosis Safe
      const safeTxs: BaseTransaction[] = pendingTransactions.map(tx => ({
        to: tx.transaction.to,
        value: tx.transaction.value.toString(),
        data: tx.transaction.data,
      }))

      // Send batch transaction to Safe
      const result = await safeSDK.txs.send({ txs: safeTxs })
      const safeTxHash = result.safeTxHash

      // Keep as 'executing' and store safeTxHash to track completion
      setTransactions(prev => prev.map(tx =>
        pendingTransactions.some(ptx => ptx.id === tx.id)
          ? { ...tx, status: 'executing' as TransactionStatus, safeTxHash }
          : tx
      ))

      showAlert("success", "Batch transaction submitted to Safe. Waiting for execution...")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (isUserRejection(errorMessage)) {
        // Reset to pending if user cancelled
        setTransactions(prev => prev.map(tx =>
          pendingTransactions.some(ptx => ptx.id === tx.id)
            ? { ...tx, status: 'pending' as TransactionStatus }
            : tx
        ))
        // Throw descriptive error for user rejection
        const maxTitles = 3
        const titles = pendingTransactions.slice(0, maxTitles).map(tx => tx.label)
        const remaining = pendingTransactions.length - maxTitles
        const txTitles = remaining > 0
          ? `${titles.join(', ')} and ${remaining} more`
          : titles.join(', ')
        throw new Error(`User rejected batch transaction: [${txTitles}]`)
      } else {
        // Mark as failed for actual errors
        setTransactions(prev => prev.map(tx =>
          pendingTransactions.some(ptx => ptx.id === tx.id)
            ? { ...tx, status: 'failed' as TransactionStatus, error: errorMessage }
            : tx
        ))
        throw error
      }
    }
  }, [safeSDK, setTransactions, showAlert, simulateBatchTransaction])

  return { executeTransactions }
}
