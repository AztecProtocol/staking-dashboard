import { useWriteContract, useWaitForTransactionReceipt } from '@/hooks/useWagmiStrategy'
import { ATPNonWithdrawableStakerAbi } from '@/contracts/abis/ATPNonWithdrawableStaker'
import type { Address } from 'viem'

/**
 * Hook to move funds from staker contract back to ATP
 *
 * Calls ATPNonWithdrawableStaker.moveFundsBackToATP()
 */
export function useMoveFundsBackToATP(stakerAddress: Address) {
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  return {
    moveFunds: () =>
      write.writeContract({
        abi: ATPNonWithdrawableStakerAbi,
        address: stakerAddress,
        functionName: 'moveFundsBackToATP',
      }),
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  }
}
