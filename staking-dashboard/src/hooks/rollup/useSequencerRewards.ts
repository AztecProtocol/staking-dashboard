import { useReadContract } from "wagmi"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to get sequencer rewards for a specific coinbase address.
 *
 * @param coinbaseAddress - The coinbase address to query rewards for
 * @param rollupAddress   - Optional rollup contract to query. Defaults to the configured rollup
 *                          (contracts.rollup.address) for backwards compatibility. Pass an explicit
 *                          rollup when querying historical/non-canonical rollups.
 */
export function useSequencerRewards(coinbaseAddress: string, rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const query = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
    functionName: "getSequencerRewards",
    args: coinbaseAddress ? [coinbaseAddress as Address] : undefined,
    query: {
      enabled: !!coinbaseAddress,
    }
  })

  return {
    rewards: query.data as bigint | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}
