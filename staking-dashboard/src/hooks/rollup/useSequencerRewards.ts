import { useReadContract } from "wagmi"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to get sequencer rewards for a specific coinbase address
 */
export function useSequencerRewards(coinbaseAddress: string) {
  const query = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
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
