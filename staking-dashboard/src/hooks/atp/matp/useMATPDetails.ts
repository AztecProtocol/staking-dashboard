import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import { MATPAbi } from "../../../contracts/abis/MATP";
import { type MATPData } from "./matpTypes";
import { MATP_FUNCTIONS } from "../atpContractDefinitions";
import { buildMATPData } from "./matpDataBuilder";

/**
 * Hook to fetch MATP detailed data for a single address using multiple contract calls at once
 * More efficient than individual contract reads
 */
export function useMATPDetails(matpAddress: Address) {
  // Create contract calls for all MATP functions
  const contracts = MATP_FUNCTIONS.map((functionName) => ({
    address: matpAddress,
    abi: MATPAbi,
    functionName,
  }));

  const {
    data: rawResults,
    isLoading,
    error,
    refetch,
  } = useReadContracts({
    contracts,
  });

  // Use shared builder to transform results
  const matpData: MATPData = buildMATPData(matpAddress, rawResults || []);

  return {
    data: matpData,
    isLoading,
    error,
    refetch,
  };
}