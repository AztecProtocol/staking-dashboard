import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import { useAccount } from "wagmi"
import type { RawTransaction } from "@/contexts/TransactionCartContext"

/**
 * Hook for self-transferring native tokens (for testing/simulation purposes)
 * Transfers native tokens from the connected account to itself
 * Useful for testing transaction flows, UI states, and error handling
 */
export function useSelfTransfer() {
  const { address: account } = useAccount()
  const write = useWriteContract()

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  return {
    /**
     * Transfer native tokens to self
     * @param amount - Amount of native tokens to transfer (in wei)
     */
    selfTransfer: (amount: bigint) => {
      if (!account) throw new Error("No account connected")

      return write.writeContract({
        address: account,
        value: amount,
      } as any)
    },

    // Build raw transaction for queue/batching
    buildRawTx: (amount: bigint): RawTransaction => {
      if (!account) throw new Error("No account connected")

      return {
        to: account,
        data: "0x",
        value: amount,
      }
    },

    // State
    txHash: write.data,
    error: write.error || receipt.error, 
    isPending: write.isPending, 
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess, 
    isError: receipt.isError, 
    reset: write.reset,
  }
}
