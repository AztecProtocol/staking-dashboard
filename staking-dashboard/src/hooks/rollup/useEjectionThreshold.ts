import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "../../contracts"

/**
 * Hook to get the local ejection threshold from a rollup contract.
 * This is the minimum effective balance required to stay as a validator;
 * below this threshold, validators are ejected from the active set.
 *
 * @param rollupAddress - Optional rollup contract to query. Defaults to the configured rollup.
 *                        Each rollup version may have its own ejection threshold.
 */
export function useEjectionThreshold(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const { data, isLoading, error, refetch } = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
    functionName: "getLocalEjectionThreshold",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  return {
    ejectionThreshold: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}
