import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { ATPWithdrawableAndClaimableStakerAbi } from "@/contracts/abis/ATPWithdrawableAndClaimableStaker";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for delegating voting power through a Staker contract.
 * This is for ATP holders who have deposited tokens into governance via their staker.
 * Only works with Staker V2+ from atpFactoryAuction.
 * @param stakerAddress - The user's staker contract address
 */
export function useDelegateVotingPower(stakerAddress?: Address) {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    delegate: (version: bigint, attester: Address, delegatee: Address) => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return write.writeContract({
        abi: ATPWithdrawableAndClaimableStakerAbi,
        address: stakerAddress,
        functionName: "delegate",
        args: [version, attester, delegatee],
      });
    },

    buildRawTx: (version: bigint, attester: Address, delegatee: Address): RawTransaction => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return {
        to: stakerAddress,
        data: encodeFunctionData({
          abi: ATPWithdrawableAndClaimableStakerAbi,
          functionName: "delegate",
          args: [version, attester, delegatee],
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
