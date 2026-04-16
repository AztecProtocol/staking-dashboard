import { useReadContract } from "wagmi"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to check if rewards are claimable from a specific rollup contract.
 *
 * @param rollupAddress - Optional rollup contract to query. Defaults to the configured rollup.
 */
export function useIsRewardsClaimable(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const query = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
    functionName: "isRewardsClaimable"
  })

  return {
    isRewardsClaimable: query.data as boolean | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}
