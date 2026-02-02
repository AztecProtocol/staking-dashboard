import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";

/**
 * Hook to read WITHDRAWAL_TIMESTAMP from ATPWithdrawableAndClaimableStaker contract
 */
export function useStakerWithdrawalTimestamp() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.atpWithdrawableAndClaimableStaker.address,
    abi: contracts.atpWithdrawableAndClaimableStaker.abi,
    functionName: "WITHDRAWAL_TIMESTAMP"
  });

  return {
    withdrawalTimestamp: data as bigint | undefined,
    isLoading,
    error,
    refetch
  };
}
