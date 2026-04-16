import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"
import { useRollupRegistry } from "@/hooks/rollup/useRollupRegistry"
import type { CoinbaseBreakdown } from "./rewardsTypes"

/**
 * Fans `getSequencerRewards(coinbase)` out across every rollup discovered via the Aztec
 * governance Registry, in a single multicall roundtrip.
 *
 * This is the multi-rollup-aware reader behind the rewards UI. The Registry enumeration
 * happens via {@link useRollupRegistry} (cached forever); only when that returns rollups
 * does this hook issue the actual `getSequencerRewards` reads.
 *
 * Returns one `CoinbaseBreakdown` entry per `(coinbase × rollup)` pair that has a non-zero
 * balance, plus the running total. Callers display these as separate rows so operators can
 * see exactly which rollup each balance lives on, and the claim engine routes per-row claims
 * to the correct rollup contract.
 *
 * Falls back to the configured rollup only when registry discovery fails (so the dashboard
 * keeps working in single-rollup deployments and during the registry-loading window).
 */
export function useCoinbaseRewardsAcrossRollups(coinbaseAddresses: Address[]) {
  const { rollups, isLoading: isLoadingRegistry, error: registryError } = useRollupRegistry()

  // Fall back to the configured rollup if registry discovery hasn't produced anything yet.
  // This keeps single-rollup deployments and the initial-load window working.
  const effectiveRollups = useMemo(() => {
    if (rollups.length > 0) return rollups
    return [{ version: undefined as bigint | undefined, address: contracts.rollup.address }]
  }, [rollups])

  // Build a flat list of (rollup, coinbase) pairs and the matching multicall contracts.
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
      // Auto-refresh every 30 seconds to match the legacy single-rollup hook's cadence.
      refetchInterval: 30 * 1000,
    },
  })

  // Expand the results into one CoinbaseBreakdown per (coinbase, rollup) with non-zero balance.
  // Zero balances are filtered so the rewards UI doesn't render empty rows for inactive rollups.
  const coinbaseBreakdown = useMemo<CoinbaseBreakdown[]>(() => {
    if (!data || pairs.length === 0) return []
    const out: CoinbaseBreakdown[] = []
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      const result = data[i]
      const rewards =
        result?.status === "success" ? ((result.result as bigint | undefined) ?? 0n) : 0n
      if (rewards <= 0n) continue
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

  const totalCoinbaseRewards = useMemo(
    () => coinbaseBreakdown.reduce((total, item) => total + item.rewards, 0n),
    [coinbaseBreakdown],
  )

  return {
    coinbaseBreakdown,
    totalCoinbaseRewards,
    isLoading: isLoading || isLoadingRegistry,
    isError: !!isError || !!registryError,
    error: error ?? registryError,
    refetch,
  }
}
