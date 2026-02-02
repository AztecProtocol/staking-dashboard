import { writeUserAddresses } from "@/utils/localStorage"
import { useUserAddressStorage } from "../useUserAddressStorage"

const STORAGE_KEY = "rewards_manual_splits"

/**
 * Write manual split addresses to localStorage
 */
export function writeSplitsToStorage(userAddress: string, addresses: string[]): void {
  writeUserAddresses(STORAGE_KEY, userAddress, addresses)
}

/**
 * Hook to fetch user's manually-added split addresses from localStorage
 */
export function useManualSplitAddresses() {
  const storage = useUserAddressStorage({
    storageKey: STORAGE_KEY,
    queryKey: "manualSplits"
  })

  return {
    splitAddresses: storage.addresses,
    isLoading: storage.isLoading,
    isError: storage.isError,
    error: storage.error,
    refetch: storage.refetch
  }
}
