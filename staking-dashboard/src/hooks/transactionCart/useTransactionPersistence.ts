import { useEffect } from "react"
import { saveToLocalStorage, loadFromLocalStorage } from "@/utils/localStorage"
import type { CartTransaction } from "@/contexts/TransactionCartContext"
import { cartTransactionReviver } from "@/utils/transactionCart"

const STORAGE_KEY = "transaction-cart"
const CURRENT_EXECUTING_KEY = "transaction-cart-current-executing"

/**
 * Hook for persisting transaction cart to localStorage
 */
export function useTransactionPersistence(
  transactions: CartTransaction[],
  currentExecutingId: string | null
) {
  // Persist transactions to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, transactions)
  }, [transactions])

  // Persist currentExecutingId to localStorage
  useEffect(() => {
    if (currentExecutingId) {
      saveToLocalStorage(CURRENT_EXECUTING_KEY, currentExecutingId)
    } else {
      localStorage.removeItem(CURRENT_EXECUTING_KEY)
    }
  }, [currentExecutingId])
}

/**
 * Load transactions from localStorage
 */
export function loadTransactions(): CartTransaction[] {
  const stored = loadFromLocalStorage<CartTransaction[]>(STORAGE_KEY, cartTransactionReviver)
  if (!stored) return []

  // Reset transactions that are 'executing' but don't have a txHash and safeTxHash
  // The wallet popup may persist in some extensions, but we can't capture
  // the hash after refresh since the promise is lost
  return stored.map(tx => {
    if (tx.status === 'executing' && (!tx.txHash && !tx.safeTxHash)) {
      return { ...tx, status: 'pending' as const }
    }
    return tx
  })
}

/**
 * Load current executing ID from localStorage
 */
export function loadCurrentExecutingId(transactions: CartTransaction[]): string | null {
  const stored = loadFromLocalStorage<string>(CURRENT_EXECUTING_KEY)
  if (!stored) return null

  // Clear if the transaction it points to was reset to pending (no txHash)
  const tx = transactions.find(t => t.id === stored)
  if (tx && tx.status === 'pending' && !tx.txHash) {
    localStorage.removeItem(CURRENT_EXECUTING_KEY)
    return null
  }

  return stored
}
