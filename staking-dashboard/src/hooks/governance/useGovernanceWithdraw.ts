import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { contracts } from "@/contracts";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for initiating withdrawal of ERC20 tokens from the Governance contract.
 * This is a two-step process:
 * 1. initiateWithdraw - starts the withdrawal and returns a withdrawalId
 * 2. finalizeWithdraw - completes the withdrawal after the lock period
 *
 * This hook handles step 1. The withdrawal will be sent to the specified address
 * after the lock period when finalizeWithdraw is called.
 */
export function useGovernanceWithdraw() {
  const write = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    initiateWithdraw: (to: Address, amount: bigint) =>
      write.writeContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address,
        functionName: "initiateWithdraw",
        args: [to, amount],
      }),

    buildRawTx: (to: Address, amount: bigint): RawTransaction => ({
      to: contracts.governance.address,
      data: encodeFunctionData({
        abi: contracts.governance.abi,
        functionName: "initiateWithdraw",
        args: [to, amount],
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
