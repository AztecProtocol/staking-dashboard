import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { config } from "../../config";
import type { ATPType } from "./atpTypes";

export interface ATPHolding {
  address: string;
  type: ATPType;
  allocation: string;
  beneficiary: string;
  stakerAddress: string;
  sequentialNumber: number;
  timestamp: number;
  totalWithdrawn: string;
  totalSlashed: string;
}

interface ApiResponse {
  success: boolean;
  data?: ATPHolding[];
  error?: string;
}

/**
 * Fetch ATP holdings for a given address
 */
async function fetchAtpHoldings(address: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${config.apiHost}/api/atp/beneficiary/${address}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching ATP holdings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch ATP holdings"
    };
  }
}

/**
 * Hook to fetch ATP holdings for the connected wallet from the API
 */
export function useAtpHoldings() {
  const { address: userAddress } = useAccount();

  const query = useQuery<ApiResponse>({
    queryKey: ["atpHoldings", userAddress],
    queryFn: () => fetchAtpHoldings(userAddress!),
    enabled: !!userAddress,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const atpHoldings = query.data?.data || [];
  const isError = query.isError || query.data?.success === false;
  const error = query.error || query.data?.error;

  return {
    atpHoldings,
    isLoading: query.isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}