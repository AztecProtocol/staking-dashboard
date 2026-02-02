import { useState } from "react"
import { useAccount } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { getAddress, isAddress } from "viem"
import { writeToStorage, useCoinbaseAddresses } from "./useCoinbaseAddresses"

/**
 * Hook to add a new coinbase address for the user (localStorage)
 */
export function useAddCoinbaseAddress() {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()
  const { coinbaseAddresses } = useCoinbaseAddresses()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addCoinbaseAddress = async (coinbaseAddress: string) => {
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
      if (!isAddress(coinbaseAddress)) {
        throw new Error("Invalid address format")
      }

      const checksummed = getAddress(coinbaseAddress)

      // Check if already exists
      const existingLower = coinbaseAddresses.map(a => a.toLowerCase())
      if (existingLower.includes(checksummed.toLowerCase())) {
        throw new Error("Address already exists")
      }

      // Add to localStorage
      const newAddresses = [...coinbaseAddresses, checksummed]
      writeToStorage(userAddress, newAddresses)

      setIsSuccess(true)
      // Invalidate the query to refetch
      await queryClient.invalidateQueries({ queryKey: ["coinbaseAddresses", userAddress] })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add coinbase address"))
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
    addCoinbaseAddress,
    isPending,
    isSuccess,
    isError,
    error,
    reset
  }
}
