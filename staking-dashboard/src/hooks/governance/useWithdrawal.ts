import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";

export interface Withdrawal {
  amount: bigint;
  unlocksAt: bigint;
  recipient: `0x${string}`;
  claimed: boolean;
}

interface UseWithdrawalParams {
  withdrawalId?: bigint;
}

/**
 * Hook to query the status of a specific withdrawal from the Governance contract.
 */
export function useWithdrawal({ withdrawalId }: UseWithdrawalParams) {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "getWithdrawal",
    args: withdrawalId !== undefined ? [withdrawalId] : undefined,
    query: {
      enabled: withdrawalId !== undefined,
    },
  });

  const withdrawal = query.data as Withdrawal | undefined;

  return {
    withdrawal,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
