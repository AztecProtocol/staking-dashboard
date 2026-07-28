import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Multicalls `isRewardsClaimable()` across a list of rollup contracts.
 *
 * `isRewardsClaimable()` was a network-wide reward lock on older rollups; a
 * `false` return means the protocol has frozen claims on that rollup. The V5
 * rollup removed the function entirely, so the call reverts there — but claims
 * on V5 are always live. We therefore fail OPEN: a rollup is treated as locked
 * only when it explicitly returns `false`. A revert (function absent, e.g. V5)
 * or a still-loading read is treated as claimable, so a removed view can't
 * silently disable claims. See issue #111.
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
    contracts:
      uniqueAddresses.length > 0
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

  // Fail open: locked only when the rollup explicitly returned `false`. A
  // missing entry (revert on V5 where the function no longer exists, or the
  // read hasn't resolved) is treated as claimable.
  const isClaimable = (rollupAddress: Address): boolean => {
    return claimableByRollup.get(rollupAddress.toLowerCase()) !== false
  }

  return {
    claimableByRollup,
    isClaimable,
    isLoading,
    error,
  }
}
