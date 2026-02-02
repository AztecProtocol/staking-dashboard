import { useReadContracts } from "wagmi";
import { useMemo } from "react";
import type { Address } from "viem";
import { contracts } from "../../contracts";

export interface StakerImplementationData {
  version: bigint;
  implementation: Address | undefined;
}

/**
 * Hook to fetch all staker implementations for available versions with 5-minute caching
 */
export function useStakerImplementations(stakerVersions: bigint[], registryAddress?: Address) {
  const contractAddress = registryAddress || contracts.atpRegistry.address;

  // Create read contracts for all versions
  const contractsToRead = useMemo(
    () =>
      stakerVersions.map((version) => ({
        abi: contracts.atpRegistry.abi,
        address: contractAddress,
        functionName: "getStakerImplementation" as const,
        args: [version] as const,
      })),
    [stakerVersions, contractAddress],
  );

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: contractsToRead,
    query: {
      enabled: stakerVersions.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  });

  // Process the results into a more usable format
  const implementations = useMemo(() => {
    if (!data || data.length !== stakerVersions.length) {
      return {};
    }

    const implementationMap: Record<number, Address | undefined> = {};

    data.forEach((result, index) => {
      const version = stakerVersions[index];
      implementationMap[Number(version)] =
        result.status === "success" ? (result.result as Address) : undefined;
    });

    return implementationMap;
  }, [data, stakerVersions]);

  // Convert to array format for easier iteration
  const implementationsArray = useMemo(() => {
    return stakerVersions.map((version) => ({
      version,
      implementation: implementations[Number(version)],
    }));
  }, [implementations, stakerVersions]);

  return {
    implementations, // Record<number, Address | undefined> format
    implementationsArray, // Array format for iteration
    isLoading,
    error,
    refetch,
  };
}
