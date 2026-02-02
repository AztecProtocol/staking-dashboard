/**
 * Utility functions for blockchain explorer integration
 */

/**
 * Get the base explorer URL (without trailing slash)
 * @returns The base URL for the blockchain explorer
 */
export const getExplorerBaseUrl = (): string => {
  const explorerUrl = import.meta.env.VITE_EXPLORER_URL || 'https://sepolia.etherscan.io'
  return explorerUrl.replace(/\/$/, '')
}

/**
 * Get the explorer URL for an address
 * @param address - The blockchain address to view
 * @returns Full URL to view the address in the blockchain explorer
 */
export const getExplorerAddressUrl = (address: string): string => {
  return `${getExplorerBaseUrl()}/address/${address}`
}

/**
 * Get the explorer URL for a transaction
 * @param txHash - The transaction hash to view
 * @returns Full URL to view the transaction in the blockchain explorer
 */
export const getExplorerTxUrl = (txHash: string): string => {
  return `${getExplorerBaseUrl()}/tx/${txHash}`
}

/**
 * Open an address in the blockchain explorer in a new tab
 * @param address - The blockchain address to view
 */
export const openAddressInExplorer = (address: string): void => {
  window.open(getExplorerAddressUrl(address), '_blank', 'noopener,noreferrer')
}

/**
 * Open a transaction in the blockchain explorer in a new tab
 * @param txHash - The transaction hash to view
 */
export const openTxInExplorer = (txHash: string): void => {
  window.open(getExplorerTxUrl(txHash), '_blank', 'noopener,noreferrer')
}