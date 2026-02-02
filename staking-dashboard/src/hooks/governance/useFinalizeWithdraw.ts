import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { contracts } from "@/contracts";

/**
 * Hook for finalizing a withdrawal from the Governance contract.
 * This is step 2 of the withdrawal process, called after the lock period has passed.
 */
export function useFinalizeWithdraw() {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    finalizeWithdraw: (withdrawalId: bigint) =>
      write.writeContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address,
        functionName: "finalizeWithdraw",
        args: [withdrawalId],
      }),

    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
