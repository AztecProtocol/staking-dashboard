import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { contracts } from "../../contracts";

/**
 * Hook to get rollup data including version and activation threshold.
 *
 * @param rollupAddress - Optional rollup contract to query. Defaults to the configured rollup.
 *                        Pass an explicit address to read version/threshold from a non-canonical
 *                        rollup (e.g. for stranded-stake withdrawal flows).
 */
export function useRollupData(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address;

  const rollupVersionQuery = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
    functionName: "getVersion",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  });

  const activationThresholdQuery = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
    functionName: "getActivationThreshold",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  });

  return {
    version: rollupVersionQuery.data as bigint | undefined,
    activationThreshold: activationThresholdQuery.data as bigint | undefined,
    isLoading: rollupVersionQuery.isLoading || activationThresholdQuery.isLoading,
    error: rollupVersionQuery.error || activationThresholdQuery.error,
  };
}
