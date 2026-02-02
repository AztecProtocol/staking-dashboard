import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { BaseStakerAbi } from "../../contracts/abis/BaseStaker";

/**
 * Hook to get the operator address for a staker contract
 * @param stakerAddress The staker contract address to query
 */
export function useStakerOperator(stakerAddress: Address) {
  const operatorQuery = useReadContract({
    abi: BaseStakerAbi,
    address: stakerAddress,
    functionName: "getOperator",
    query: {
      enabled: !!stakerAddress,
    },
  });

  return {
    operator: operatorQuery.data as Address | undefined,
    isLoading: operatorQuery.isLoading,
    error: operatorQuery.error,
    refetch: operatorQuery.refetch,
  };
}