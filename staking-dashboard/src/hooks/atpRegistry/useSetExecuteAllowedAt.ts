import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AtpRegistryAbi } from "../../contracts/abis/ATPRegistry";
import { contracts } from "../../contracts";

/**
 * Hook for setting the executeAllowedAt timestamp in ATP Registry
 * @param registryAddress ATP Registry contract address
 */
export function useSetExecuteAllowedAt() {
  const write = useWriteContract();

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    setExecuteAllowedAt: (executeAllowedAt: bigint | number) =>
      write.writeContract({
        abi: AtpRegistryAbi,
        address: contracts.atpRegistry.address,
        functionName: "setExecuteAllowedAt",
        args: [BigInt(executeAllowedAt)],
      }),

    // State
    txHash: write.data,
    error: write.error || receipt.error, // Include both wallet errors and transaction errors
    isPending: write.isPending, // Wallet confirmation
    isConfirming: receipt.isLoading, // Waiting to be mined
    isSuccess: receipt.isSuccess, // Successfully mined
    isError: receipt.isError, // Failed/reverted
  };
}
