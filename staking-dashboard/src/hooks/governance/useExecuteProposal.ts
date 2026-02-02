import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { contracts } from "@/contracts";

/**
 * Hook for executing a proposal on the Governance contract.
 * Anyone can execute a proposal once it's in the Executable state.
 */
export function useExecuteProposal() {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    execute: (proposalId: bigint) =>
      write.writeContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address,
        functionName: "execute",
        args: [proposalId],
      }),

    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
