import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to claim sequencer rewards to a specified coinbase address.
 *
 * @param rollupAddress - Optional rollup contract to claim from. Defaults to the configured
 *                        rollup. Callers that need to claim across multiple rollups should pass
 *                        the specific rollup address each call lives on.
 */
export function useClaimSequencerRewards(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data
  })

  return {
    claimRewards: (coinbaseAddress: Address, overrideRollup?: Address) => {
      return write.writeContract({
        abi: contracts.rollup.abi,
        address: overrideRollup ?? targetRollup,
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
