import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Multicalls `isRewardsClaimable()` across a list of rollup contracts.
 * Returns a Map keyed by lowercased rollup address; `undefined` means still loading.
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
