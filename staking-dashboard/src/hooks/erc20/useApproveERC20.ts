import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import type { Address } from "viem";
import { ERC20Abi } from "@/contracts/abis/ERC20";

/**
 * Hook for approving an ERC20 token spender
 * @param tokenAddress - The ERC20 token contract address
 */
export function useApproveERC20(tokenAddress?: Address) {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    approve: (spender: Address, amount: bigint) => {
      if (!tokenAddress) {
        throw new Error("Token address is required");
      }
      return write.writeContract({
        abi: ERC20Abi,
        address: tokenAddress,
        functionName: "approve",
        args: [spender, amount],
      });
    },

    reset: write.reset,
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
