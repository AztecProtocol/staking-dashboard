import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { ATPWithdrawableAndClaimableStakerAbi } from "@/contracts/abis/ATPWithdrawableAndClaimableStaker";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for initiating withdrawal of ATP tokens from governance through a Staker contract.
 * This is for ATP holders who deposited via depositIntoGovernance.
 *
 * The withdrawal flow is:
 * 1. Call initiateWithdrawFromGovernance(amount) on Staker - returns withdrawalId
 * 2. Wait for lock period
 * 3. Call finalizeWithdraw(withdrawalId) on Governance contract
 *
 * @param stakerAddress - The user's staker contract address
 */
export function useInitiateWithdrawFromGovernance(stakerAddress?: Address) {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    initiateWithdraw: (amount: bigint) => {
      if (!stakerAddress) {
        throw new Error("Staker address is required");
      }
      return write.writeContract({
        abi: ATPWithdrawableAndClaimableStakerAbi,
        address: stakerAddress,
        functionName: "initiateWithdrawFromGovernance",
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
          functionName: "initiateWithdrawFromGovernance",
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
