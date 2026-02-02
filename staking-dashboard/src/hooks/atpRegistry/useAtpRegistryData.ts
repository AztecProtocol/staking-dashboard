import { useReadContract } from "wagmi";
import { useMemo } from "react";
import type { Address } from "viem";
import { AtpRegistryAbi } from "../../contracts/abis/ATPRegistry";
import { contracts } from "../../contracts";

interface UseAtpRegistryDataParams {
  registryAddress?: Address;
}

/**
 * Determines if a registry address is an auction registry
 */
export function isAuctionRegistry(registryAddress?: Address): boolean {
  if (!registryAddress) return false;
  return registryAddress.toLowerCase() === contracts.atpRegistryAuction.address.toLowerCase();
}

/**
 * Hook for ATP Registry read operations 
 * @param registryAddress - Optional registry address. If not provided, uses default regular registry
 */
export function useAtpRegistryData({ registryAddress }: UseAtpRegistryDataParams = {}) {
  const contractAddress = registryAddress || contracts.atpRegistry.address;

  // Read executeAllowedAt using AtpRegistry ABI
  const executeAllowedAtQuery = useReadContract({
    abi: AtpRegistryAbi,
    address: contractAddress,
    functionName: "getExecuteAllowedAt",
  });

  // Read owner from ATP Registry contract
  const registryOwnerQuery = useReadContract({
    abi: AtpRegistryAbi,
    address: contractAddress,
    functionName: "owner",
  });

  // Read next staker version from ATP Registry contract
  const nextStakerVersionQuery = useReadContract({
    abi: contracts.atpRegistry.abi,
    address: contractAddress,
    functionName: "getNextStakerVersion",
  });

  // Read next milestone ID
  const nextMilestoneIdQuery = useReadContract({
    abi: contracts.atpRegistry.abi,
    address: contractAddress,
    functionName: "getNextMilestoneId",
  });

  // Array of all queries for efficient state checking
  const queries = [
    executeAllowedAtQuery,
    registryOwnerQuery,
    nextStakerVersionQuery,
    nextMilestoneIdQuery,
  ];

  // Process staker versions
  const stakerVersions = useMemo(() => {
    if (!nextStakerVersionQuery.data) return [];
    try {
      const nextVersion = BigInt(nextStakerVersionQuery.data.toString());
      // return all versions from 0 up to (nextVersion - 1)
      return Array.from({ length: Number(nextVersion) }, (_, i) => BigInt(i));
    } catch {
      return [];
    }
  }, [nextStakerVersionQuery.data]);

  // Process milestone IDs
  const milestoneIds = useMemo(() => {
    if (!nextMilestoneIdQuery.data) return [];
    try {
      const nextId = BigInt(nextMilestoneIdQuery.data.toString());
      // return all IDs from 0 up to (ID - 1)
      return Array.from({ length: Number(nextId) }, (_, i) => BigInt(i));
    } catch {
      return [];
    }
  }, [nextMilestoneIdQuery.data]);

  return {
    // Data fields
    executeAllowedAt: executeAllowedAtQuery.data,
    registryOwner: registryOwnerQuery.data,
    stakerVersions,
    milestoneIds,

    // Refetch functions
    refetchExecuteAllowedAt: executeAllowedAtQuery.refetch,

    // Consolidated states using array methods
    isLoading: queries.some((query) => query.isLoading),
    error: queries.find((query) => query.error)?.error,
  };
}
