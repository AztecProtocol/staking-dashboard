import { useAccount } from "wagmi"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { readUserAddresses } from "@/utils/localStorage"

interface UseUserAddressStorageOptions {
  storageKey: string
  queryKey: string
}

/**
 * Generic hook for user-scoped address storage with React Query
 */
export function useUserAddressStorage({ storageKey, queryKey }: UseUserAddressStorageOptions) {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [queryKey, userAddress],
    queryFn: () => {
      if (!userAddress) return []
      return readUserAddresses(storageKey, userAddress)
    },
    enabled: !!userAddress,
    staleTime: Infinity,
    gcTime: Infinity
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey, userAddress] })
  }

  return {
    addresses: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch
  }
}
