import { useReadContract } from "wagmi"
import { contracts } from "../../contracts"

/**
 * Hook to get the local ejection threshold from the rollup contract
 * This is the minimum effective balance required to stay as a validator
 * Below this threshold, validators are ejected from the active set
 */
export function useEjectionThreshold() {
  const { data, isLoading, error, refetch } = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
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
