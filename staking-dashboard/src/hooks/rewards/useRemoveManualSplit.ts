import { useState } from "react"
import { useAccount } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { writeSplitsToStorage, useManualSplitAddresses } from "./useManualSplitAddresses"

/**
 * Hook to remove a manual split address for the user (localStorage)
 */
export function useRemoveManualSplit() {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()
  const { splitAddresses } = useManualSplitAddresses()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const removeManualSplit = async (splitAddress: string) => {
    if (!userAddress) {
      setError(new Error("Wallet not connected"))
      setIsError(true)
      return
    }

    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    setError(null)

    try {
      // Filter out the address to remove (case-insensitive comparison)
      const newAddresses = splitAddresses.filter(
        addr => addr.toLowerCase() !== splitAddress.toLowerCase()
      )

      // Write updated list to localStorage
      writeSplitsToStorage(userAddress, newAddresses)

      setIsSuccess(true)
      // Invalidate the query to refetch
      await queryClient.invalidateQueries({ queryKey: ["manualSplits", userAddress] })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove split address"))
      setIsError(true)
    } finally {
      setIsPending(false)
    }
  }

  const reset = () => {
    setIsPending(false)
    setIsSuccess(false)
    setIsError(false)
    setError(null)
  }

  return {
    removeManualSplit,
    isPending,
    isSuccess,
    isError,
    error,
    reset
  }
}
