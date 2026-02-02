import { useState } from "react"
import { useAccount } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { writeToStorage, useCoinbaseAddresses } from "./useCoinbaseAddresses"

/**
 * Hook to remove a coinbase address for the user (localStorage)
 */
export function useRemoveCoinbaseAddress() {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()
  const { coinbaseAddresses } = useCoinbaseAddresses()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const removeCoinbaseAddress = async (coinbaseAddress: string) => {
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
      const newAddresses = coinbaseAddresses.filter(
        addr => addr.toLowerCase() !== coinbaseAddress.toLowerCase()
      )

      // Write updated list to localStorage
      writeToStorage(userAddress, newAddresses)

      setIsSuccess(true)
      // Invalidate the query to refetch
      await queryClient.invalidateQueries({ queryKey: ["coinbaseAddresses", userAddress] })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove coinbase address"))
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
    removeCoinbaseAddress,
    isPending,
    isSuccess,
    isError,
    error,
    reset
  }
}
