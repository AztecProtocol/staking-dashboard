import { useCallback } from "react"
import type { CartTransaction } from "@/contexts/TransactionCartContext"
import { useAlert } from "@/contexts/AlertContext"
import { useEOAExecution } from "./useEOAExecution"
import { useSafeExecution } from "./useSafeExecution"
import { useSafeApp } from "../useSafeApp"

interface UseTransactionExecutionProps {
  transactions: CartTransaction[]
  setTransactions: React.Dispatch<React.SetStateAction<CartTransaction[]>>
  setCurrentExecutingId: React.Dispatch<React.SetStateAction<string | null>>
}

/**
 * Hook for executing transactions (orchestrates between EOA and Safe)
 */
export function useTransactionExecution({
  transactions,
  setTransactions,
  setCurrentExecutingId
}: UseTransactionExecutionProps) {
  const { isSafeApp, sdk: safeSDK } = useSafeApp()

  const { showAlert } = useAlert()

  // EOA execution hook
  const { executeTransactions: executeEOA } = useEOAExecution({
    setTransactions,
    setCurrentExecutingId
  })

  // Safe execution hook
  const { executeTransactions: executeSafe } = useSafeExecution({
    setTransactions
  })

  const executeAll = useCallback(async () => {
    // Filter transactions that need to be executed
    const pendingTransactions = transactions.filter(tx =>
      tx.status === 'pending' || tx.status === undefined
    )

    if (pendingTransactions.length === 0) {
      showAlert("info", "No pending transactions to execute")
      return
    }

    // Route to appropriate execution handler
    if (isSafeApp && safeSDK) {
      await executeSafe(pendingTransactions, transactions)
    } else {
      await executeEOA(pendingTransactions, transactions)
    }
  }, [transactions, isSafeApp, safeSDK, executeEOA, executeSafe, showAlert])

  return { executeAll }
}
