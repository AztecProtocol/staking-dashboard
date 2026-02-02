import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import type { Address } from "viem"
import { ATPWithdrawableStakerAbi } from "@/contracts/abis/ATPWithdrawableStaker"

/**
 * Hook to finalize withdrawal from the rollup for a delegation
 * @param stakerAddress - Address of the withdrawable staker contract
 * @returns Hook with finalizeWithdraw function and transaction status
 */
export function useFinalizeWithdraw(stakerAddress: Address) {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const finalizeWithdraw = (version: bigint, attesterAddress: Address) => {
    return writeContract({
      abi: ATPWithdrawableStakerAbi,
      address: stakerAddress,
      functionName: "finalizeWithdraw",
      args: [version, attesterAddress],
    })
  }

  return {
    finalizeWithdraw,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
