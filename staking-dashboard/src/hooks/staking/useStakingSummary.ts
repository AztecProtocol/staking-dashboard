import { useQuery } from '@tanstack/react-query'
import { config } from '@/config'

export interface StakingStats {
  totalStakes: number
  delegatedStakes: number
  directStakes: number
  activeProviders: number
  failedDeposits: number
  totalATPs: number
  activationThreshold: string
}

export interface StakingSummaryResponse {
  totalValueLocked: string
  totalStakers: number
  currentAPR: number
  stats: StakingStats
}

/**
 * Fetches staking summary data from the API
 */
async function fetchStakingSummary(): Promise<StakingSummaryResponse> {
  const response = await fetch(`${config.apiHost}/api/staking/summary`)

  if (!response.ok) {
    throw new Error(`Failed to fetch staking summary: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Hook to fetch and manage staking summary data
 * Auto-refreshes every 30 seconds for live updates
 */
export const useStakingSummary = () => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery<StakingSummaryResponse>({
    queryKey: ['staking-summary'],
    queryFn: fetchStakingSummary,
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load staking summary' : null

  return {
    data,
    isLoading,
    isRefetching,
    error: errorMessage,
    refetch
  }
}