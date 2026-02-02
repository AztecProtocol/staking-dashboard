import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { contracts } from "../../contracts";

export function useStakerImplementation(stakerVersion?: bigint | number) {
  const stakerImplementationQuery = useReadContract({
    abi: contracts.atpRegistry.abi,
    address: contracts.atpRegistry.address,
    functionName: "getStakerImplementation",
    args: stakerVersion !== undefined ? [BigInt(stakerVersion)] : undefined,
    query: {
      enabled: stakerVersion !== undefined,
    },
  });

  return {
    stakerImplementation: stakerImplementationQuery.data as Address | undefined,
    isLoading: stakerImplementationQuery.isLoading,
    error: stakerImplementationQuery.error,
    refetch: stakerImplementationQuery.refetch,
  };
}
