import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"
import { useRollupRegistry } from "@/hooks/rollup/useRollupRegistry"
import type { CoinbaseBreakdown } from "./rewardsTypes"

/**
 * Multicalls `getSequencerRewards(coinbase)` across every registry-discovered rollup.
 * Returns one `CoinbaseBreakdown` per `(coinbase, rollup)` pair with a non-zero balance.
 */
export function useCoinbaseRewardsAcrossRollups(coinbaseAddresses: Address[]) {
  const { rollups, isLoading: isLoadingRegistry, error: registryError } = useRollupRegistry()

  const effectiveRollups = useMemo(() => {
    if (rollups.length > 0) return rollups
    return [{ version: undefined as bigint | undefined, address: contracts.rollup.address }]
  }, [rollups])

  const pairs = useMemo(() => {
    const out: Array<{ rollupAddress: Address; rollupVersion: bigint | undefined; coinbase: Address }> = []
    for (const rollup of effectiveRollups) {
      for (const coinbase of coinbaseAddresses) {
        out.push({ rollupAddress: rollup.address, rollupVersion: rollup.version, coinbase })
      }
    }
    return out
  }, [effectiveRollups, coinbaseAddresses])

  const { data, isLoading, isError, error, refetch } = useReadContracts({
    contracts: pairs.length > 0
      ? pairs.map(
          (p) =>
            ({
              address: p.rollupAddress,
              abi: contracts.rollup.abi,
              functionName: "getSequencerRewards",
              args: [p.coinbase],
            }) as const,
        )
      : undefined,
    query: {
      enabled: pairs.length > 0,
      refetchInterval: 30 * 1000,
    },
  })

  const allCoinbaseBreakdown = useMemo<CoinbaseBreakdown[]>(() => {
    if (!data || pairs.length === 0) return []
    const out: CoinbaseBreakdown[] = []
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      const result = data[i]
      const rewards =
        result?.status === "success" ? ((result.result as bigint | undefined) ?? 0n) : 0n
      out.push({
        address: pair.coinbase,
        rewards,
        source: "manual",
        rollupAddress: pair.rollupAddress,
        rollupVersion: pair.rollupVersion,
      })
    }
    return out
  }, [data, pairs])

  const coinbaseBreakdown = useMemo(
    () => allCoinbaseBreakdown.filter((item) => item.rewards > 0n),
    [allCoinbaseBreakdown],
  )

  const totalCoinbaseRewards = useMemo(
    () => coinbaseBreakdown.reduce((total, item) => total + item.rewards, 0n),
    [coinbaseBreakdown],
  )

  return {
    allCoinbaseBreakdown,
    coinbaseBreakdown,
    totalCoinbaseRewards,
    isLoading: isLoading || isLoadingRegistry,
    isError: !!isError || !!registryError,
    error: error ?? registryError,
    refetch,
  }
}
