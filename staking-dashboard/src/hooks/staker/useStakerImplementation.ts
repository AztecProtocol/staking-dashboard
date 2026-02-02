import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { BaseStakerAbi } from "../../contracts/abis/BaseStaker";

/**
 * Hook to get the implementation address from a BaseStaker contract
 */
export function useStakerImplementation(stakerAddress: Address) {
  const implementationQuery = useReadContract({
    abi: BaseStakerAbi,
    address: stakerAddress,
    functionName: "getImplementation",
    query: {
      enabled: !!stakerAddress
    }
  });

  return {
    implementation: implementationQuery.data as Address | undefined,
    isLoading: implementationQuery.isLoading,
    error: implementationQuery.error,
    refetch: implementationQuery.refetch,
  };
}
