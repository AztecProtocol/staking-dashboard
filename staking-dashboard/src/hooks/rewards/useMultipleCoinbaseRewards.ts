import { useReadContracts } from "wagmi"
import { contracts } from "@/contracts"
import type { Address } from "viem"
import type { CoinbaseBreakdown } from "./rewardsTypes"

/**
 * Hook to fetch rewards for multiple coinbase addresses
 * Uses batched contract calls for efficiency
 */
export function useMultipleCoinbaseRewards(coinbaseAddresses: Address[]) {
  // Build contract calls for each coinbase address
  const contractCalls = coinbaseAddresses.map(address => ({
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
    functionName: "getSequencerRewards" as const,
    args: [address]
  }))

  const { data, isLoading, isError, error, refetch } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: coinbaseAddresses.length > 0,
      refetchInterval: 30 * 1000 // Auto-refresh every 30 seconds
    }
  })

  // Parse results into CoinbaseBreakdown objects
  const coinbaseBreakdown: CoinbaseBreakdown[] = coinbaseAddresses.map((address, index) => {
    const result = data?.[index]
    const rewards = (result?.status === "success" ? result.result as bigint : 0n) ?? 0n

    return {
      address,
      rewards,
      source: "manual" as const
    }
  })

  // Calculate total rewards
  const totalCoinbaseRewards = coinbaseBreakdown.reduce(
    (total, item) => total + item.rewards,
    0n
  )

  return {
    coinbaseBreakdown,
    totalCoinbaseRewards,
    isLoading,
    isError,
    error,
    refetch
  }
}
