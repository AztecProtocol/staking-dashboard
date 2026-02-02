import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to initiate withdrawal from the rollup for wallet (ERC20) stakes
 *
 * For direct ERC20 staking, the user is the withdrawer and calls initiateWithdraw
 * directly on the Rollup contract. This is different from ATP staking where
 * withdrawals are initiated through the staker contract.
 *
 * @returns Hook with initiateWithdraw function and transaction status
 */
export function useWalletInitiateWithdraw() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  const initiateWithdraw = (attesterAddress: Address, recipientAddress: Address) => {
    return writeContract({
      abi: contracts.rollup.abi,
      address: contracts.rollup.address,
      functionName: "initiateWithdraw",
      args: [attesterAddress, recipientAddress],
    })
  }

  return {
    initiateWithdraw,
    reset,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isError: !!error || receiptError,
    hash,
  }
}
