import { useBlock } from "wagmi"

const REFRESH_INTERVAL_MS = 12_000 // Match L1 block time

/**
 * Hook that fetches and caches block.timestamp, refreshing every 12 seconds.
 * Used for time-sensitive on-chain checks (e.g., withdrawal eligibility).
 *
 * This ensures consistent behavior across all users regardless of their local
 * system time, matching the blockchain's view of time for on-chain validation.
 */
export function useBlockTimestamp() {
  const { data: block, isLoading, error, refetch } = useBlock({
    query: {
      staleTime: REFRESH_INTERVAL_MS,
      refetchInterval: REFRESH_INTERVAL_MS,
      gcTime: Infinity,
      retry: 3,
    },
  })

  return {
    blockTimestamp: block?.timestamp,
    isLoading,
    error,
    refetch,
  }
}
