import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { encodeFunctionData, type Address } from "viem"
import { ERC20Abi } from "@/contracts/abis/ERC20"
import { contracts } from "@/contracts"
import type { RawTransaction } from "@/contexts/TransactionCartContext"

/**
 * Hook for approving ERC20 tokens for the StakingRegistry to spend
 * Used for wallet-based staking (not ATP staking)
 * @param tokenAddress - The ERC20 token contract address
 */
export function useApproveStakingRegistry(tokenAddress?: Address) {
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  return {
    /**
     * Approve the StakingRegistry to spend tokens
     * @param amount - The amount to approve
     */
    approve: (amount: bigint) => {
      if (!tokenAddress) {
        throw new Error("Token address is required")
      }
      return write.writeContract({
        abi: ERC20Abi,
        address: tokenAddress,
        functionName: "approve",
        args: [contracts.stakingRegistry.address, amount],
      })
    },

    /**
     * Build raw transaction for queue/batching
     * @param amount - The amount to approve
     */
    buildRawTx: (amount: bigint): RawTransaction => {
      if (!tokenAddress) {
        throw new Error("Token address is required")
      }
      return {
        to: tokenAddress,
        data: encodeFunctionData({
          abi: ERC20Abi,
          functionName: "approve",
          args: [contracts.stakingRegistry.address, amount],
        }),
        value: 0n,
      }
    },

    reset: write.reset,
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  }
}
