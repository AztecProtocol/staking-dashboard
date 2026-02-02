import { writeUserAddresses } from "@/utils/localStorage"
import { useUserAddressStorage } from "../useUserAddressStorage"

const STORAGE_KEY = "rewards_coinbase_addresses"

/**
 * Write coinbase addresses to localStorage
 */
export function writeToStorage(userAddress: string, addresses: string[]): void {
  writeUserAddresses(STORAGE_KEY, userAddress, addresses)
}

/**
 * Hook to fetch user's saved coinbase addresses from localStorage
 */
export function useCoinbaseAddresses() {
  const storage = useUserAddressStorage({
    storageKey: STORAGE_KEY,
    queryKey: "coinbaseAddresses"
  })

  return {
    coinbaseAddresses: storage.addresses,
    isLoading: storage.isLoading,
    isError: storage.isError,
    error: storage.error,
    refetch: storage.refetch
  }
}
