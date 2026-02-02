import { useReadContract } from "wagmi";
import { contracts } from "../../contracts";

export function useStakingRegistryData() {
  const nextProviderIdQuery = useReadContract({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "nextProviderIdentifier",
  });

  const nextProviderId = nextProviderIdQuery.data as bigint | undefined;
  const contractProviderCount = nextProviderId ? Number(nextProviderId) : 0;

  return {
    nextProviderId,
    contractProviderCount,
    isLoading: nextProviderIdQuery.isLoading,
    error: nextProviderIdQuery.error,
    refetch: nextProviderIdQuery.refetch,
  };
}
