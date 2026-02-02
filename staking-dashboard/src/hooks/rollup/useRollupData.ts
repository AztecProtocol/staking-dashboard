import { useReadContract } from "wagmi";
import { contracts } from "../../contracts";

/**
 * Hook to get rollup data including version and activation threshold
 */
export function useRollupData() {
  const rollupVersionQuery = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
    functionName: "getVersion",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  });

  const activationThresholdQuery = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
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
