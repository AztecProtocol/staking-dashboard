import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import { SplitAbi } from "@/contracts/abis/Split"
import type { SplitData } from "./types"

/**
 * Hook to distribute rewards from Split contract
 * Step 1: Call distribute() on the Split contract to distribute rewards
 */
export function useDistributeRewards(splitContractAddress: Address | undefined) {
  const { address: userAddress } = useAccount()
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  return {
    distribute: (splitData: SplitData, tokenAddress: Address) => {
      if (!splitContractAddress || !userAddress) {
        throw new Error("Missing required addresses")
      }

      const tuple = {
        recipients: splitData.recipients,
        allocations: splitData.allocations,
        totalAllocation: splitData.totalAllocation,
        distributionIncentive: splitData.distributionIncentive,
      }

      return write.writeContract({
        abi: SplitAbi,
        address: splitContractAddress,
        functionName: "distribute",
        args: [tuple, tokenAddress, userAddress],
      })
    },
    reset: write.reset,
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: write.isError || receipt.isError,
  }
}
