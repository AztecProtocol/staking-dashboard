import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { CommonATPAbi } from "@/contracts/abis/ATP";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for upgrading a staker in ATP
 * @param address ATP contract address (optional - functions will throw if called without address)
 */
export function useUpgradeStaker(address?: Address) {
  const write = useWriteContract();

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    upgradeStaker: (version: bigint | number) => {
      if (!address) {
        throw new Error("ATP address is required");
      }
      return write.writeContract({
        abi: CommonATPAbi,
        address,
        functionName: "upgradeStaker",
        args: [BigInt(version)],
      });
    },

    // Build raw transaction for queue/batching
    buildRawTx: (version: bigint | number): RawTransaction => {
      if (!address) {
        throw new Error("ATP address is required");
      }
      return {
        to: address,
        data: encodeFunctionData({
          abi: CommonATPAbi,
          functionName: "upgradeStaker",
          args: [BigInt(version)],
        }),
        value: 0n,
      };
    },

    // State
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
