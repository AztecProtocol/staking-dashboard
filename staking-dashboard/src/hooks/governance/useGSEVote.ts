import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "@/hooks/useWagmiStrategy";
import { contracts } from "@/contracts";

/**
 * Hook for voting on governance proposals using delegated staked voting power.
 * This is for users who have received voting power delegation from staked validators.
 * The vote is cast through the GSE (Governance Staking Extension) contract.
 */
export function useGSEVote() {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    vote: (proposalId: bigint, amount: bigint, support: boolean) => {
      return write.writeContract({
        abi: contracts.gse.abi,
        address: contracts.gse.address,
        functionName: "vote",
        args: [proposalId, amount, support],
      });
    },

    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  };
}
