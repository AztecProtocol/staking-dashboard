import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { usePublicClient } from "wagmi"
import { useAlert } from "./AlertContext"
import { useSafeApp } from "@/hooks/useSafeApp"
import { useTransactionPersistence, loadTransactions, loadCurrentExecutingId } from "@/hooks/transactionCart/useTransactionPersistence"
import { useTransactionExecution } from "@/hooks/transactionCart/useTransactionExecution"
import { useTransactionTracking } from "@/hooks/transactionCart/useTransactionTracking"
import { useSafeStatusPolling } from "@/hooks/transactionCart/useSafeStatusPolling"
import { getTransactionSignature } from "@/utils/transactionCart"
import type {
  TransactionType,
  DelegationMetadata,
  SelfStakeMetadata,
  WalletDirectStakeMetadata,
  RawTransaction,
  TransactionStatus,
  CartTransaction,
  AddTransactionOptions,
  TransactionCartContextType
} from "./TransactionCartContextType"

// Re-export types for backwards compatibility
export type {
  TransactionType,
  DelegationMetadata,
  SelfStakeMetadata,
  WalletDirectStakeMetadata,
  RawTransaction,
  TransactionStatus,
  CartTransaction,
  AddTransactionOptions
}

const TransactionCartContext = createContext<TransactionCartContextType | undefined>(undefined)

interface TransactionCartProviderProps {
  children: ReactNode
}

/**
 * Provider for managing transaction batching cart
 * Allows users to batch multiple transactions and execute them sequentially
 * Persists transactions to localStorage to survive page refreshes
 */
export function TransactionCartProvider({ children }: TransactionCartProviderProps) {
  const [transactions, setTransactions] = useState<CartTransaction[]>(loadTransactions)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecutingId, setCurrentExecutingId] = useState<string | null>(() => {
    const txs = loadTransactions()
    return loadCurrentExecutingId(txs)
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  const publicClient = usePublicClient()

  const { showAlert } = useAlert()
  const { isSafeApp } = useSafeApp()

  // Persistence hook
  useTransactionPersistence(transactions, currentExecutingId)

  // Tracking hook for resume after refresh
  useTransactionTracking(publicClient, transactions, setTransactions, currentExecutingId, setCurrentExecutingId, isExecuting)

  // Safe status polling hook for batch execution tracking
  useSafeStatusPolling({
    transactions,
    setTransactions
  })

  // Execution hook
  const { executeAll: executeAllTransactions } = useTransactionExecution({
    transactions,
    setTransactions,
    setCurrentExecutingId
  })

  const checkTransactionInQueue = useCallback((transaction: RawTransaction): boolean => {
    const signature = getTransactionSignature(transaction)
    return transactions.some(tx => getTransactionSignature(tx.transaction) === signature)
  }, [transactions])

  /**
   * Resolve dependencies - find transactions that match the dependency metadata, to make sure the tranasction order is correct
   */
  const resolveDependencies = useCallback((transaction: CartTransaction, allTransactions: CartTransaction[]): CartTransaction[] => {
    const metadata = transaction.metadata
    if (!metadata || !('dependsOn' in metadata) || !metadata.dependsOn || metadata.dependsOn.length === 0) {
      return []
    }

    return metadata.dependsOn
      .map(dep => allTransactions.find(tx => {
        const txMeta = tx.metadata
        return txMeta && 'stepType' in txMeta && 'stepGroupIdentifier' in txMeta &&
          txMeta.stepType === dep.stepType &&
          txMeta.stepGroupIdentifier === dep.stepGroupIdentifier
      }))
      .filter((tx): tx is CartTransaction => tx !== undefined)
  }, [])

  const addTransaction = useCallback((transaction: Omit<CartTransaction, "id">, options?: AddTransactionOptions) => {
    // Check for duplicates before adding
    if (options?.preventDuplicate && checkTransactionInQueue(transaction.transaction)) {
      showAlert("warning", "Transaction already exists in batch")
      return
    }

    let wasAdded = false
    let errorMessage: string | null = null

    setTransactions(prev => {
      const tempId = `${transaction.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const tempTransaction = { ...transaction, id: tempId, status: 'pending' as const }

      // Check if all dependencies are available
      const metadata = transaction.metadata
      if (metadata && 'dependsOn' in metadata && metadata.dependsOn && metadata.dependsOn.length > 0) {
        const dependencies = resolveDependencies(tempTransaction as CartTransaction, prev)

        if (dependencies.length !== metadata.dependsOn.length) {
          // Find which dependencies are missing
          const foundStepTypes = new Set(dependencies.map(dep => dep.metadata && 'stepType' in dep.metadata ? dep.metadata.stepType : null))
          const missingDeps = metadata.dependsOn.filter(dep => !foundStepTypes.has(dep.stepType))
          const missingNames = missingDeps.map(dep => dep.stepName || dep.stepType).join(", ")

          errorMessage = `Cannot add transaction ${transaction.label}: missing dependencies (${missingNames})`
          return prev
        }
      }

      // All dependencies met or no dependencies, add the transaction
      wasAdded = true
      return [...prev, tempTransaction as CartTransaction]
    })

    // Show alerts after state update
    if (errorMessage) {
      showAlert("error", errorMessage)
    } else if (wasAdded) {
      showAlert("success", `Added "${transaction.label}" to batch`)
    }
  }, [showAlert, checkTransactionInQueue, resolveDependencies])

  /**
   * Check if any transaction depends on the given transaction
   */
  const hasDependents = useCallback((txId: string, allTransactions: CartTransaction[]): boolean => {
    const target = allTransactions.find(tx => tx.id === txId)
    if (!target) return false

    return allTransactions.some(tx => {
      if (tx.id === txId) return false
      const dependencies = resolveDependencies(tx, allTransactions)
      return dependencies.some(dep => dep.id === txId)
    })
  }, [resolveDependencies])

  const removeTransaction = useCallback((id: string) => {
    let hasDeps = false

    setTransactions(prev => {
      // Check if any transaction depends on this one
      if (hasDependents(id, prev)) {
        hasDeps = true
        return prev
      }
      return prev.filter(tx => tx.id !== id)
    })

    // Show alert after state update
    if (hasDeps) {
      showAlert("warning", "Cannot remove: other transactions depend on this one")
    }
  }, [hasDependents, showAlert])

  const clearCart = useCallback(() => {
    setTransactions([])
  }, [])

  const clearCompleted = useCallback(() => {
    setTransactions(prev => prev.filter(tx => tx.status !== 'completed'))
  }, [])

  const clearByType = useCallback((type: TransactionType) => {
    setTransactions(prev => prev.filter(tx => tx.type !== type))
  }, [])

  const moveUp = useCallback((id: string) => {
    setTransactions(prev => {
      const index = prev.findIndex(tx => tx.id === id)
      if (index <= 0) return prev

      const newTransactions = [...prev]
        ;[newTransactions[index - 1], newTransactions[index]] = [newTransactions[index], newTransactions[index - 1]]
      return newTransactions
    })
  }, [])

  const moveDown = useCallback((id: string) => {
    setTransactions(prev => {
      const index = prev.findIndex(tx => tx.id === id)
      if (index === -1 || index >= prev.length - 1) return prev

      const newTransactions = [...prev]
        ;[newTransactions[index], newTransactions[index + 1]] = [newTransactions[index + 1], newTransactions[index]]
      return newTransactions
    })
  }, [])

  const executeAll = useCallback(async () => {
    if (transactions.length === 0 || isExecuting) return

    // Validate all dependencies before execution
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      const dependencies = resolveDependencies(tx, transactions)

      for (const dep of dependencies) {
        const depIndex = transactions.findIndex(t => t.id === dep.id)
        if (depIndex > i) {
          showAlert("error", `Invalid order: "${tx.label}" depends on "${dep.label}" which comes after it`)
          return
        }
      }
    }

    setIsExecuting(true)

    try {
      await executeAllTransactions()
      // Note: Don't clear completed transactions here - let state changes propagate first
      // Users can manually clear using clearCompleted() or the completed transactions
      // will be cleared on the next page refresh
    } catch (error) {
      console.error("Error executing transactions:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to execute transactions"
      showAlert("error", errorMessage)
    } finally {
      setIsExecuting(false)
      setCurrentExecutingId(null)
    }
  }, [transactions, isExecuting, executeAllTransactions, showAlert, resolveDependencies])

  const getTransaction = useCallback((id: string): CartTransaction | undefined => {
    return transactions.find(tx => tx.id === id)
  }, [transactions])

  const getTransactionByTx = useCallback((transaction: RawTransaction): CartTransaction | undefined => {
    const signature = getTransactionSignature(transaction)
    return transactions.find(tx => getTransactionSignature(tx.transaction) === signature)
  }, [transactions])

  const openCart = useCallback(() => {
    setIsCartOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  return (
    <TransactionCartContext.Provider
      value={{
        transactions,
        addTransaction,
        removeTransaction,
        clearCart,
        clearByType,
        clearCompleted,
        executeAll,
        isExecuting,
        currentExecutingId,
        moveUp,
        moveDown,
        checkTransactionInQueue,
        getTransaction,
        getTransactionByTx,
        isSafe: isSafeApp,
        isCartOpen,
        openCart,
        closeCart
      }}
    >
      {children}
    </TransactionCartContext.Provider>
  )
}

/**
 * Hook to access transaction cart context
 */
export function useTransactionCart() {
  const context = useContext(TransactionCartContext)
  if (context === undefined) {
    throw new Error("useTransactionCart must be used within TransactionCartProvider")
  }
  return context
}
