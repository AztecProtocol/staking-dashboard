import { useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "@/hooks/useWagmiStrategy";
import { CommonATPAbi } from "@/contracts/abis/ATP";
import { ATPWithdrawableAndClaimableStakerAbi } from "@/contracts/abis/ATPWithdrawableAndClaimableStaker";
import { useAllowance } from "@/hooks/erc20/useAllowance";
import { useApproveStaker } from "@/hooks/atp/useApproveStaker";
import type { ATPData } from "./atpTypes";

/**
 * Hook for claiming tokens from ATP
 * For NCATP: checks allowance and provides approval flow before withdrawAllTokensToBeneficiary
 * For other ATP types: calls claim() directly
 */
export function useATPClaim(atpData: ATPData) {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  const isNCATP = atpData.typeString === "NCATP";
  const hasRequiredFields = !!atpData.staker && !!atpData.token;

  // Check current allowance from ATP to Staker (only for NCATP with valid addresses)
  // Note: It's safe to pass potentially undefined addresses because useAllowance has
  // an `enabled` guard that prevents the query from running when addresses are falsy
  const {
    allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useAllowance({
    tokenAddress: atpData.token,
    owner: atpData.atpAddress,
    spender: atpData.staker,
  });

  // Use existing approveStaker hook (calls ATP.approveStaker)
  const approveStakerHook = useApproveStaker(atpData.atpAddress);

  const claimableAmount = atpData.claimable ?? 0n;
  const needsApproval =
    isNCATP &&
    hasRequiredFields &&
    allowance !== undefined &&
    allowance < claimableAmount;

  // Refetch allowance after approval confirms
  useEffect(() => {
    if (approveStakerHook.isSuccess) {
      refetchAllowance();
    }
  }, [approveStakerHook.isSuccess, refetchAllowance]);

  return {
    claim: () => {
      if (isNCATP && atpData.staker) {
        return write.writeContract({
          abi: ATPWithdrawableAndClaimableStakerAbi,
          address: atpData.staker,
          functionName: "withdrawAllTokensToBeneficiary",
        });
      } else {
        return write.writeContract({
          abi: CommonATPAbi,
          address: atpData.atpAddress,
          functionName: "claim",
        });
      }
    },

    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,

    // Approval state (NCATP only)
    needsApproval,
    allowance,
    isLoadingAllowance:
      isNCATP && hasRequiredFields ? isLoadingAllowance : false,

    // Approve function using existing hook - accepts optional amount override
    approveStaker: (amount?: bigint) => approveStakerHook.approveStaker(amount ?? claimableAmount),
    isApprovePending: approveStakerHook.isPending,
    isApproveConfirming: approveStakerHook.isConfirming,
    isApproveSuccess: approveStakerHook.isSuccess,
    isApproveError: approveStakerHook.isError,
    approveError: approveStakerHook.error,

    // Refetch allowance (call after finalize withdraw to update needsApproval)
    refetchAllowance,
  };
}
