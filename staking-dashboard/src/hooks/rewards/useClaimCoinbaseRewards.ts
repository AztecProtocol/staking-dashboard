import { useClaimSequencerRewards } from "@/hooks/rollup/useClaimSequencerRewards"
import type { Address } from "viem"

/**
 * Hook to claim rewards for a coinbase address
 * This is a wrapper around useClaimSequencerRewards for consistency
 *
 * Claim flow for self-stake (coinbase) rewards is 1 step:
 * 1. Call claimSequencerRewards(coinbaseAddress) - rewards go directly to coinbase
 */
export function useClaimCoinbaseRewards() {
  const claimSequencerRewards = useClaimSequencerRewards()

  return {
    claimRewards: (coinbaseAddress: Address) => claimSequencerRewards.claimRewards(coinbaseAddress),
    reset: claimSequencerRewards.reset,
    txHash: claimSequencerRewards.txHash,
    error: claimSequencerRewards.error,
    isPending: claimSequencerRewards.isPending,
    isConfirming: claimSequencerRewards.isConfirming,
    isSuccess: claimSequencerRewards.isSuccess,
    isError: claimSequencerRewards.isError
  }
}
