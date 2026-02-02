import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import type { Address } from "viem"
import { ATPWithdrawableStakerAbi } from "@/contracts/abis/ATPWithdrawableStaker"

/**
 * Hook to initiate withdrawal from the rollup for a delegation
 * @param stakerAddress - Address of the withdrawable staker contract
 * @returns Hook with initiateWithdraw function and transaction status
 */
export function useInitiateWithdraw(stakerAddress: Address) {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const initiateWithdraw = (version: bigint, attesterAddress: Address) => {
    return writeContract({
      abi: ATPWithdrawableStakerAbi,
      address: stakerAddress,
      functionName: "initiateWithdraw",
      args: [version, attesterAddress],
    })
  }

  return {
    initiateWithdraw,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
