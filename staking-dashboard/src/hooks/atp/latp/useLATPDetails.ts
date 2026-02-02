import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import { LATPAbi } from "../../../contracts/abis/LATP";
import { type LATPData } from "./latpTypes";
import { LATP_FUNCTIONS } from "../atpContractDefinitions";
import { buildLATPData } from "./latpDataBuilder";

/**
 * Hook to fetch LATP detailed data for a single address using multiple contract calls at once
 * More efficient than individual contract reads
 */
export function useLATPDetails(latpAddress: Address) {
  // Create contract calls for all LATP functions
  const contracts = LATP_FUNCTIONS.map((functionName) => ({
    address: latpAddress,
    abi: LATPAbi,
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
  const latpData: LATPData = buildLATPData(latpAddress, rawResults || [], undefined);

  return {
    data: latpData,
    isLoading,
    error,
    refetch,
  };
}