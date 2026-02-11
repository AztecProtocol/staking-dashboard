import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";

export interface GovernanceWithdrawal {
  amount: bigint;
  unlocksAt: bigint;
  recipient: string;
  claimed: boolean;
}

/**
 * Hook to query a governance withdrawal by ID
 * @param withdrawalId - The withdrawal ID from the rollup exit
 * @returns Governance withdrawal details including the actual unlocksAt timestamp
 */
export function useGovernanceWithdrawal(withdrawalId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.governance.address,
    abi: contracts.governance.abi,
    functionName: "getWithdrawal",
    args: withdrawalId !== undefined ? [withdrawalId] : undefined,
    query: {
      enabled: withdrawalId !== undefined,
      retry: false,
    },
  });

  return {
    withdrawal: data as GovernanceWithdrawal | undefined,
    isLoading,
    error,
    refetch,
  };
}
