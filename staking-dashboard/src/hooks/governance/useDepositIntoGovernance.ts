import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { ATPWithdrawableAndClaimableStakerAbi } from "@/contracts/abis/ATPWithdrawableAndClaimableStaker";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for depositing ATP tokens into governance through a Staker contract.
 * This is for ATP holders who want to participate in governance.
 * Prerequisites:
 * 1. Staker must be upgraded to a version that supports governance
 * 2. ATP must have approved the staker (approveStaker)
 * @param stakerAddress - The user's staker contract address
 */
export function useDepositIntoGovernance(stakerAddress?: Address) {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    deposit: (amount: bigint) => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return write.writeContract({
        abi: ATPWithdrawableAndClaimableStakerAbi,
        address: stakerAddress,
        functionName: "depositIntoGovernance",
        args: [amount],
      });
    },

    buildRawTx: (amount: bigint): RawTransaction => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return {
        to: stakerAddress,
        data: encodeFunctionData({
          abi: ATPWithdrawableAndClaimableStakerAbi,
          functionName: "depositIntoGovernance",
          args: [amount],
        }),
        value: 0n,
      };
    },

    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
