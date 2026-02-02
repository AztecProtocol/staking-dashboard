import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to claim sequencer rewards to a specified coinbase address
 */
export function useClaimSequencerRewards() {
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data
  })

  return {
    claimRewards: (coinbaseAddress: Address) => {
      return write.writeContract({
        abi: contracts.rollup.abi,
        address: contracts.rollup.address,
        functionName: "claimSequencerRewards",
        args: [coinbaseAddress]
      })
    },
    reset: write.reset,
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: write.isError || receipt.isError
  }
}
