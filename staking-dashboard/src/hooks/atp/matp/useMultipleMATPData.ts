import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import { MATPAbi } from "../../../contracts/abis/MATP";
import { MATPDataSchema, type MATPData } from "./matpTypes";

// Contract function names for MATP data
const MATP_FUNCTIONS = [
  "getAllocation",
  "getBeneficiary",
  "getOperator",
  "getStaker",
  "getClaimable",
  "getClaimed",
  "getGlobalLock",
  "getMilestoneId",
  "getRegistry",
  "getType",
  "getToken",
] as const;

/**
 * Hook to fetch MATP data for multiple addresses
 * Uses batch contract reads for efficiency with Zod validation
 */
export function useMultipleMATPData(addresses: Address[]) {
  // Create contract calls for each address and function combination
  const contracts = addresses.flatMap((address) =>
    MATP_FUNCTIONS.map((functionName) => ({
      address,
      abi: MATPAbi,
      functionName,
    })),
  );

  const {
    data: rawResults,
    isLoading,
    error,
    refetch,
  } = useReadContracts({
    contracts,
  });

  // Transform and validate results using Zod
  const matpData: MATPData[] = addresses.map((address, addressIndex) => {
    const startIndex = addressIndex * MATP_FUNCTIONS.length;

    const rawData = {
      atpAddress: address,
      allocation: rawResults?.[startIndex + 0]?.result,
      beneficiary: rawResults?.[startIndex + 1]?.result,
      operator: rawResults?.[startIndex + 2]?.result,
      staker: rawResults?.[startIndex + 3]?.result,
      claimable: rawResults?.[startIndex + 4]?.result,
      claimed: rawResults?.[startIndex + 5]?.result,
      globalLock: rawResults?.[startIndex + 6]?.result,
      milestoneId: rawResults?.[startIndex + 7]?.result,
      registry: rawResults?.[startIndex + 8]?.result,
      type: rawResults?.[startIndex + 9]?.result,
      token: rawResults?.[startIndex + 10]?.result,
    };

    // Use Zod to safely parse and validate the data
    const result = MATPDataSchema.safeParse(rawData);

    if (result.success) {
      return result.data as MATPData;
    } else {
      // Log validation errors and return minimal valid data
      console.warn(`MATP data validation failed for ${address}:`, result.error);
      return {
        atpAddress: address,
        allocation: undefined,
        beneficiary: undefined,
        operator: undefined,
        staker: undefined,
        claimable: undefined,
        claimed: undefined,
        globalLock: undefined,
        milestoneId: undefined,
        registry: undefined,
        type: undefined,
        token: undefined,
      } as MATPData;
    }
  });

  return {
    data: matpData,
    isLoading,
    error,
    refetch,
  };
}
