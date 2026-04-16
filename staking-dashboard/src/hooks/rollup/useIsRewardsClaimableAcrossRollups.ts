import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Reads `isRewardsClaimable()` from a list of rollup contracts in a single multicall.
 *
 * Each rollup has its own `isRewardsClaimable` storage flag (toggled by the rollup owner),
 * so a row showing rewards on rollup v2 may be claimable while a row on v3 is locked, or
 * vice versa. This hook returns a Map keyed by the lowercased rollup address so callers can
 * cheaply look up the right flag per row.
 *
 * Returns `undefined` for rollups that haven't loaded yet; consumers should treat
 * `undefined` as "still loading" and not as "unclaimable".
 */
export function useIsRewardsClaimableAcrossRollups(rollupAddresses: Address[]) {
  const uniqueAddresses = useMemo(() => {
    const seen = new Set<string>()
    const out: Address[] = []
    for (const a of rollupAddresses) {
      const key = a.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(a)
    }
    return out
  }, [rollupAddresses])

  const { data, isLoading, error } = useReadContracts({
    contracts: uniqueAddresses.length > 0
      ? uniqueAddresses.map(
          (address) =>
            ({
              address,
              abi: contracts.rollup.abi,
              functionName: "isRewardsClaimable",
            }) as const,
        )
      : undefined,
    query: {
      enabled: uniqueAddresses.length > 0,
    },
  })

  const claimableByRollup = useMemo(() => {
    const map = new Map<string, boolean>()
    if (!data) return map
    for (let i = 0; i < uniqueAddresses.length; i++) {
      const result = data[i]
      if (result?.status === "success") {
        map.set(uniqueAddresses[i].toLowerCase(), result.result as boolean)
      }
    }
    return map
  }, [data, uniqueAddresses])

  /** Convenience lookup that returns `undefined` while loading, then `true`/`false`. */
  const isClaimable = (rollupAddress: Address): boolean | undefined => {
    return claimableByRollup.get(rollupAddress.toLowerCase())
  }

  return {
    claimableByRollup,
    isClaimable,
    isLoading,
    error,
  }
}
