import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to finalize withdrawal from the rollup
 *
 * This hook calls the Rollup contract directly instead of going through the staker contract.
 * The staker contract has a bug where it calls `finaliseWithdraw` (British spelling) but
 * the actual Rollup contract uses `finalizeWithdraw` (American spelling).
 *
 * @returns Hook with finalizeWithdraw function and transaction status
 */
export function useFinalizeWithdraw() {
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data
  })

  return {
    finalizeWithdraw: (attesterAddress: Address) => {
      return write.writeContract({
        abi: contracts.rollup.abi,
        address: contracts.rollup.address,
        functionName: "finalizeWithdraw",
        args: [attesterAddress]
      })
    },
    reset: write.reset,
    hash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: write.isError || receipt.isError
  }
}
