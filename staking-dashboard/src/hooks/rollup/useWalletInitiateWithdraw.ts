import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * Hook to initiate withdrawal from a rollup for wallet (ERC20) stakes.
 *
 * For direct ERC20 staking, the user is the withdrawer and calls initiateWithdraw
 * directly on the Rollup contract. This is different from ATP staking where
 * withdrawals are initiated through the staker contract.
 *
 * @param rollupAddress - Optional rollup contract to withdraw from. Defaults to the configured
 *                        rollup. For stranded stakes (originally deposited with
 *                        `_moveWithRollup=false`) callers must pass the rollup the stake actually
 *                        lives on, not the canonical rollup.
 *
 * @returns Hook with initiateWithdraw function and transaction status
 */
export function useWalletInitiateWithdraw(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  const initiateWithdraw = (attesterAddress: Address, recipientAddress: Address, overrideRollup?: Address) => {
    return writeContract({
      abi: contracts.rollup.abi,
      address: overrideRollup ?? targetRollup,
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
