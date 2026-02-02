import { useReadContract, useReadContracts } from "wagmi";
import { contracts } from "../../contracts";
import { useMemo } from "react";

/**
 * Hook to fetch configuration for a single provider
 */
export function useProviderConfigurations(providerIdentifier: number) {
  const { data, refetch, isLoading, error } = useReadContract({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "providerConfigurations",
    args: [BigInt(providerIdentifier)],
    query: {
      staleTime: 60_000,
      gcTime: 60_000,
    },
  });

  return {
    providerAdmin: data?.[0],
    providerTakeRate: data?.[1] !== undefined ? Number(data[1]) : undefined,
    providerRewardsRecipient: data?.[2],
    refetchProviderConfigurations: refetch,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch configurations for multiple providers
 */
export function useMultipleProviderConfigurations(providerIds: number[]) {
  // Build contract calls for each provider
  const contractCalls = useMemo(
    () =>
      providerIds.map((id) => ({
        abi: contracts.stakingRegistry.abi,
        address: contracts.stakingRegistry.address,
        functionName: "providerConfigurations" as const,
        args: [BigInt(id)],
      })),
    [providerIds]
  );

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: providerIds.length > 0,
      staleTime: 60_000,
      gcTime: 60_000,
    },
  });

  // Transform results into a map of providerId -> configuration
  const configurations = useMemo(() => {
    const configMap = new Map<
      number,
      {
        providerAdmin: string | undefined;
        providerTakeRate: number | undefined;
        providerRewardsRecipient: string | undefined;
      }
    >();

    if (!data) return configMap;

    providerIds.forEach((id, index) => {
      const result = data[index]?.result as [string, bigint, string] | undefined;
      if (result) {
        configMap.set(id, {
          providerAdmin: result[0],
          providerTakeRate: result[1] !== undefined ? Number(result[1]) : undefined,
          providerRewardsRecipient: result[2],
        });
      }
    });

    return configMap;
  }, [data, providerIds]);

  return {
    configurations,
    isLoading,
    error,
    refetch,
  };
}