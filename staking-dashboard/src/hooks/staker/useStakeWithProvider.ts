import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy";
import { encodeFunctionData, type Address } from "viem";
import { ATPNonWithdrawableStakerAbi } from "../../contracts/abis/ATPNonWithdrawableStaker";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for staking with a provider
 * @param address Staker contract address
 */
export function useStakeWithProvider(address: Address) {
  const write = useWriteContract();

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    stakeWithProvider: (
      version: bigint | number,
      providerIdentifier: bigint | number,
      expectedProviderTakeRate: number,
      userRewardsRecipient: Address,
      moveWithLatestRollup: boolean,
    ) => {
      return write.writeContract({
        abi: ATPNonWithdrawableStakerAbi,
        address,
        functionName: "stakeWithProvider",
        args: [
          BigInt(version),
          BigInt(providerIdentifier),
          expectedProviderTakeRate,
          userRewardsRecipient,
          moveWithLatestRollup,
        ],
      });
    },

    // Build raw transaction for queue/batching
    buildRawTx: (
      version: bigint | number,
      providerIdentifier: bigint | number,
      expectedProviderTakeRate: number,
      userRewardsRecipient: Address,
      moveWithLatestRollup: boolean,
    ): RawTransaction => ({
      to: address,
      data: encodeFunctionData({
        abi: ATPNonWithdrawableStakerAbi,
        functionName: "stakeWithProvider",
        args: [
          BigInt(version),
          BigInt(providerIdentifier),
          expectedProviderTakeRate,
          userRewardsRecipient,
          moveWithLatestRollup,
        ],
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
