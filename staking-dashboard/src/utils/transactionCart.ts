/**
 * Reviver function to convert string BigInt values back to BigInt
 */
export const cartTransactionReviver = (key: string, value: any): any => {
  // Convert value field in transaction
  if (key === "value" && typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value)
  }
  // Convert amount field in metadata
  if (key === "amount" && typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value)
  }
  // Convert rewards field in metadata
  if (key === "rewards" && typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value)
  }
  return value
}

/**
 * Check if error is a user rejection
 */
export const isUserRejection = (errorMessage: string): boolean => {
  return errorMessage.toLowerCase().includes('user rejected') ||
    errorMessage.toLowerCase().includes('user denied') ||
    errorMessage.toLowerCase().includes('rejected') ||
    errorMessage.toLowerCase().includes('cancelled')
}

/**
 * Generate transaction signature for duplicate detection
 */
export const getTransactionSignature = (tx: { to: string; data: string; value: bigint }): string => {
  return `${tx.to}-${tx.data}-${tx.value}`
}
