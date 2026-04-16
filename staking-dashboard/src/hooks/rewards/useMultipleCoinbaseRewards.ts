import type { Address } from "viem"
import { useCoinbaseRewardsAcrossRollups } from "./useCoinbaseRewardsAcrossRollups"

/**
 * Hook to fetch rewards for multiple coinbase addresses.
 *
 * This is a thin compatibility wrapper around {@link useCoinbaseRewardsAcrossRollups}
 * which fans the read out across every rollup discovered via the Aztec governance
 * Registry. The returned `coinbaseBreakdown` may contain multiple entries for the same
 * coinbase address — one per rollup that has a non-zero balance — so the rewards UI
 * naturally surfaces stranded balances on older rollups.
 */
export function useMultipleCoinbaseRewards(coinbaseAddresses: Address[]) {
  return useCoinbaseRewardsAcrossRollups(coinbaseAddresses)
}
