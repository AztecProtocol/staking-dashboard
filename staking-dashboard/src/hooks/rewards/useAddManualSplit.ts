import { useState } from "react"
import { useAccount } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { getAddress, isAddress } from "viem"
import { writeSplitsToStorage, useManualSplitAddresses } from "./useManualSplitAddresses"

/**
 * Hook to add a new manual split address for the user (localStorage)
 */
export function useAddManualSplit() {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()
  const { splitAddresses } = useManualSplitAddresses()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addManualSplit = async (splitAddress: string) => {
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
      // Validate address format
      if (!isAddress(splitAddress)) {
        throw new Error("Invalid address format")
      }

      const checksummed = getAddress(splitAddress)

      // Check if already exists
      const existingLower = splitAddresses.map(a => a.toLowerCase())
      if (existingLower.includes(checksummed.toLowerCase())) {
        throw new Error("Address already exists")
      }

      // Add to localStorage
      const newAddresses = [...splitAddresses, checksummed]
      writeSplitsToStorage(userAddress, newAddresses)

      setIsSuccess(true)
      // Invalidate the query to refetch
      await queryClient.invalidateQueries({ queryKey: ["manualSplits", userAddress] })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add split address"))
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
    addManualSplit,
    isPending,
    isSuccess,
    isError,
    error,
    reset
  }
}
