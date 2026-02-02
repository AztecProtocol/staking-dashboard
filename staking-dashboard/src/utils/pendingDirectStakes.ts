/**
 * Utility for managing pending ERC20 direct stakes in localStorage.
 *
 * ERC20 direct stakes (via Rollup.deposit()) don't appear in the API until
 * the validator queue is flushed. This utility allows tracking pending stakes
 * locally so users can see them in the UI immediately after staking.
 *
 * ## Why localStorage instead of a new database table?
 *
 * We considered adding a `ValidatorQueued` event handler to the indexer to track
 * stakes immediately when they enter the queue. However, this approach had issues:
 *
 * 1. **Race conditions**: The `ValidatorQueued` event fires for ALL deposits
 *    (ATP, ERC20-with-provider, ERC20-direct). Detecting which ones are "ERC20 direct"
 *    requires checking if records exist in other tables, but event ordering within
 *    the same transaction could cause false positives.
 *
 * 2. **Schema complexity**: Would require a new `erc20DirectStake` table and careful
 *    deduplication logic to avoid double-counting stakes that also appear in the
 *    `deposit` table after activation.
 *
 * 3. **Production risk**: Backend changes require more testing and carry higher risk
 *    for a production system.
 *
 * The localStorage approach is simpler, safer, and provides the same UX benefit:
 * users see their stake immediately after the transaction completes.
 */

import { saveToLocalStorage, loadFromLocalStorage } from './localStorage'
import type { Address } from 'viem'

const PENDING_STAKES_KEY = 'pending-erc20-direct-stakes'

/**
 * Pending stake entry stored in localStorage
 */
export interface PendingDirectStake {
  attesterAddress: Address
  withdrawerAddress: Address
  stakedAmount: string // Store as string for JSON serialization
  txHash: string
  timestamp: number
  createdAt: number // When the entry was added (for cleanup)
}

/**
 * Get all pending stakes for a given wallet address
 */
export function getPendingDirectStakes(walletAddress: Address): PendingDirectStake[] {
  const allPendingStakes = loadFromLocalStorage<Record<string, PendingDirectStake[]>>(PENDING_STAKES_KEY)
  if (!allPendingStakes) return []
  return allPendingStakes[walletAddress.toLowerCase()] || []
}

/**
 * Add a new pending stake for a wallet address
 *
 * DEDUPLICATION: Uses attester address as the unique key. This means if a user
 * stakes twice to the same attester before indexing, only the first is tracked.
 * This is acceptable because:
 * 1. Once either stake is indexed, the API will return the correct total
 * 2. The frontend deduplication logic (useAggregatedStakingData) filters by
 *    attester address, so it works regardless of which stake is in localStorage
 * 3. Multiple stakes to the same attester are rare in practice
 */
export function addPendingDirectStake(
  walletAddress: Address,
  stake: Omit<PendingDirectStake, 'createdAt'>
): void {
  const allPendingStakes = loadFromLocalStorage<Record<string, PendingDirectStake[]>>(PENDING_STAKES_KEY) || {}
  const key = walletAddress.toLowerCase()
  const existingStakes = allPendingStakes[key] || []

  // Don't add duplicates (check by attester address)
  // This prevents showing the same stake multiple times if the user refreshes
  // or navigates between pages before the transaction is mined
  const exists = existingStakes.some(
    s => s.attesterAddress.toLowerCase() === stake.attesterAddress.toLowerCase()
  )
  if (exists) return

  const newStake: PendingDirectStake = {
    ...stake,
    createdAt: Date.now(),
  }

  allPendingStakes[key] = [...existingStakes, newStake]
  saveToLocalStorage(PENDING_STAKES_KEY, allPendingStakes)
}

/**
 * Remove a pending stake when it appears in the API response
 */
export function removePendingDirectStake(walletAddress: Address, attesterAddress: Address): void {
  const allPendingStakes = loadFromLocalStorage<Record<string, PendingDirectStake[]>>(PENDING_STAKES_KEY)
  if (!allPendingStakes) return

  const key = walletAddress.toLowerCase()
  const existingStakes = allPendingStakes[key] || []

  allPendingStakes[key] = existingStakes.filter(
    s => s.attesterAddress.toLowerCase() !== attesterAddress.toLowerCase()
  )

  // Clean up empty arrays
  if (allPendingStakes[key].length === 0) {
    delete allPendingStakes[key]
  }

  saveToLocalStorage(PENDING_STAKES_KEY, allPendingStakes)
}

/**
 * Remove multiple pending stakes at once (when they appear in API)
 */
export function removePendingDirectStakes(walletAddress: Address, attesterAddresses: Address[]): void {
  const normalizedAttesters = new Set(attesterAddresses.map(a => a.toLowerCase()))
  const allPendingStakes = loadFromLocalStorage<Record<string, PendingDirectStake[]>>(PENDING_STAKES_KEY)
  if (!allPendingStakes) return

  const key = walletAddress.toLowerCase()
  const existingStakes = allPendingStakes[key] || []

  allPendingStakes[key] = existingStakes.filter(
    s => !normalizedAttesters.has(s.attesterAddress.toLowerCase())
  )

  // Clean up empty arrays
  if (allPendingStakes[key].length === 0) {
    delete allPendingStakes[key]
  }

  saveToLocalStorage(PENDING_STAKES_KEY, allPendingStakes)
}

/**
 * Clear all pending stakes for a wallet (e.g., on disconnect)
 */
export function clearPendingDirectStakes(walletAddress: Address): void {
  const allPendingStakes = loadFromLocalStorage<Record<string, PendingDirectStake[]>>(PENDING_STAKES_KEY)
  if (!allPendingStakes) return

  const key = walletAddress.toLowerCase()
  delete allPendingStakes[key]

  saveToLocalStorage(PENDING_STAKES_KEY, allPendingStakes)
}

/**
 * Clean up stale pending stakes (older than 7 days)
 * This prevents localStorage from accumulating stale entries
 */
export function cleanupStalePendingStakes(): void {
  const allPendingStakes = loadFromLocalStorage<Record<string, PendingDirectStake[]>>(PENDING_STAKES_KEY)
  if (!allPendingStakes) return

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  for (const key of Object.keys(allPendingStakes)) {
    allPendingStakes[key] = allPendingStakes[key].filter(s => s.createdAt > sevenDaysAgo)
    if (allPendingStakes[key].length === 0) {
      delete allPendingStakes[key]
    }
  }

  saveToLocalStorage(PENDING_STAKES_KEY, allPendingStakes)
}
