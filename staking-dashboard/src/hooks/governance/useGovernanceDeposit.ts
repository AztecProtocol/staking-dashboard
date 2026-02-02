import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { contracts } from "@/contracts";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for depositing ERC20 tokens directly into the Governance contract.
 * This is for users who hold ERC20 tokens directly (not through ATP).
 * Note: User must approve the Governance contract to spend their tokens first.
 */
export function useGovernanceDeposit() {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    deposit: (onBehalfOf: Address, amount: bigint) =>
      write.writeContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address,
        functionName: "deposit",
        args: [onBehalfOf, amount],
      }),

    buildRawTx: (onBehalfOf: Address, amount: bigint): RawTransaction => ({
      to: contracts.governance.address,
      data: encodeFunctionData({
        abi: contracts.governance.abi,
        functionName: "deposit",
        args: [onBehalfOf, amount],
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
