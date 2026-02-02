import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { MATPAbi } from "../../contracts/abis/MATP";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for updating a staker's operator in ATP
 * @param address ATP contract address
 */
export function useUpdateStakerOperator(address: Address) {
  const write = useWriteContract();

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data, 
  });

  return {
    updateStakerOperator: (operator: Address) =>
      write.writeContract({
        abi: MATPAbi,
        address,
        functionName: "updateStakerOperator",
        args: [operator],
      }),

    // Build raw transaction for queue/batching
    buildRawTx: (operator: Address): RawTransaction => ({
      to: address,
      data: encodeFunctionData({
        abi: MATPAbi,
        functionName: "updateStakerOperator",
        args: [operator],
      }),
      value: 0n,
    }),

    // State
    txHash: write.data,
    error: write.error || receipt.error, 
    isPending: write.isPending, 
    isConfirming: receipt.isLoading, 
    isSuccess: receipt.isSuccess, 
    isError: receipt.isError, 
  };
}
