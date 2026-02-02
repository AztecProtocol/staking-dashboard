import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { CommonATPAbi } from "@/contracts/abis/ATP";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for approving a staker in ATP
 * @param address ATP contract address
 */
export function useApproveStaker(address?: Address) {
  const write = useWriteContract();

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    approveStaker: (allowance: bigint | number) => {
      if (!address) {
        throw new Error("ATP address is required");
      }
      return write.writeContract({
        abi: CommonATPAbi,
        address,
        functionName: "approveStaker",
        args: [BigInt(allowance)],
      });
    },

    // Build raw transaction for queue/batching
    buildRawTx: (allowance: bigint | number): RawTransaction => {
      if (!address) {
        throw new Error("ATP address is required");
      }
      return {
        to: address,
        data: encodeFunctionData({
          abi: CommonATPAbi,
          functionName: "approveStaker",
          args: [BigInt(allowance)],
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
