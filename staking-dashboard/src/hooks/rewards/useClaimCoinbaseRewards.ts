import { useClaimSequencerRewards } from "@/hooks/rollup/useClaimSequencerRewards"
import type { Address } from "viem"

/**
 * Hook to claim rewards for a coinbase address.
 * This is a wrapper around useClaimSequencerRewards for consistency.
 *
 * Claim flow for self-stake (coinbase) rewards is 1 step:
 * 1. Call claimSequencerRewards(coinbaseAddress) - rewards go directly to coinbase
 *
 * @param rollupAddress - Optional default rollup contract to claim from. Defaults to the
 *                        configured rollup. The returned `claimRewards` also accepts an
 *                        optional per-call rollup override so callers iterating over
 *                        multiple rollups can re-use a single hook instance.
 */
export function useClaimCoinbaseRewards(rollupAddress?: Address) {
  const claimSequencerRewards = useClaimSequencerRewards(rollupAddress)

  return {
    claimRewards: (coinbaseAddress: Address, overrideRollup?: Address) =>
      claimSequencerRewards.claimRewards(coinbaseAddress, overrideRollup),
    reset: claimSequencerRewards.reset,
    txHash: claimSequencerRewards.txHash,
    error: claimSequencerRewards.error,
    isPending: claimSequencerRewards.isPending,
    isConfirming: claimSequencerRewards.isConfirming,
    isSuccess: claimSequencerRewards.isSuccess,
    isError: claimSequencerRewards.isError
  }
}
