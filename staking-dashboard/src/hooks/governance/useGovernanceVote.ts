import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData } from "viem";
import { contracts } from "@/contracts";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for voting directly on the Governance contract.
 * This is for users who have deposited ERC20 tokens directly into governance
 * (not through an ATP/Staker).
 */
export function useGovernanceVote() {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    vote: (proposalId: bigint, amount: bigint, support: boolean) =>
      write.writeContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address,
        functionName: "vote",
        args: [proposalId, amount, support],
      }),

    buildRawTx: (proposalId: bigint, amount: bigint, support: boolean): RawTransaction => ({
      to: contracts.governance.address,
      data: encodeFunctionData({
        abi: contracts.governance.abi,
        functionName: "vote",
        args: [proposalId, amount, support],
      }),
      value: 0n,
    }),

    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
