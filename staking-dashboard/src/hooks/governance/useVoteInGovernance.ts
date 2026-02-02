import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { ATPWithdrawableAndClaimableStakerAbi } from "@/contracts/abis/ATPWithdrawableAndClaimableStaker";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for voting on governance proposals through a Staker contract.
 * This is for ATP holders who have deposited tokens into governance via their staker.
 * @param stakerAddress - The user's staker contract address
 */
export function useVoteInGovernance(stakerAddress?: Address) {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    vote: (proposalId: bigint, amount: bigint, support: boolean) => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return write.writeContract({
        abi: ATPWithdrawableAndClaimableStakerAbi,
        address: stakerAddress,
        functionName: "voteInGovernance",
        args: [proposalId, amount, support],
      });
    },

    buildRawTx: (proposalId: bigint, amount: bigint, support: boolean): RawTransaction => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return {
        to: stakerAddress,
        data: encodeFunctionData({
          abi: ATPWithdrawableAndClaimableStakerAbi,
          functionName: "voteInGovernance",
          args: [proposalId, amount, support],
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
