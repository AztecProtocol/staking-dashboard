import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { MATPAbi } from "../../../contracts/abis/MATP";
import { type MATPData } from "./matpTypes";

/**
 * Hook to fetch MATP data for a single address
 * Individual contract reads for better error handling and loading states
 */
export function useMATPData(matpAddress: Address) {
  const allocationQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getAllocation",
  });

  const beneficiaryQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getBeneficiary",
  });

  const operatorQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getOperator",
  });

  const stakerQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getStaker",
  });

  const claimableQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getClaimable",
  });

  const claimedQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getClaimed",
  });

  const globalLockQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getGlobalLock",
  });

  const milestoneIdQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getMilestoneId",
  });

  const registryQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getRegistry",
  });

  const typeQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getType",
  });

  const tokenQuery = useReadContract({
    abi: MATPAbi,
    address: matpAddress,
    functionName: "getToken",
  });

  // Collect all queries for overall state calculation
  const queries = [
    allocationQuery,
    beneficiaryQuery,
    operatorQuery,
    stakerQuery,
    claimableQuery,
    claimedQuery,
    globalLockQuery,
    milestoneIdQuery,
    registryQuery,
    typeQuery,
    tokenQuery,
  ];

  const matpData: MATPData = {
    atpAddress: matpAddress,
    allocation: allocationQuery.data,
    beneficiary: beneficiaryQuery.data,
    operator: operatorQuery.data,
    staker: stakerQuery.data,
    claimable: claimableQuery.data,
    claimed: claimedQuery.data,
    globalLock: globalLockQuery.data,
    milestoneId: milestoneIdQuery.data,
    registry: registryQuery.data,
    type: typeQuery.data,
    token: tokenQuery.data,
  };

  return {
    data: matpData,
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error,
    refetch: () => queries.forEach((q) => q.refetch()),
  };
}
