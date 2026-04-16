import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"
import { useRollupRegistry } from "./useRollupRegistry"

/**
 * Locates the rollup where a given attester's stake actually lives by multicalling
 * `getAttesterView` across all registry-discovered rollups. Prefers the canonical rollup.
 */

const STATUS_NONE = 0

export interface AttesterStakeLocation {
  rollupAddress: Address
  rollupVersion: bigint | undefined
  /** Status from `getAttesterView` on the resolved rollup. */
  status: number
}

export function useAttesterStakeLocation(attesterAddress: Address | undefined) {
  const { rollups, canonical, isLoading: isLoadingRegistry, error: registryError } = useRollupRegistry()

  // Fall back to the configured rollup when registry discovery hasn't produced anything yet so
  // single-rollup deployments and the loading window keep working.
  const effectiveRollups = useMemo(() => {
    if (rollups.length > 0) return rollups
    return [{ version: undefined as bigint | undefined, address: contracts.rollup.address }]
  }, [rollups])

  const { data, isLoading, error } = useReadContracts({
    contracts: attesterAddress
      ? effectiveRollups.map(
          (r) =>
            ({
              address: r.address,
              abi: contracts.rollup.abi,
              functionName: "getAttesterView",
              args: [attesterAddress],
            }) as const,
        )
      : undefined,
    query: {
      enabled: !!attesterAddress && effectiveRollups.length > 0,
    },
  })

  const location = useMemo<AttesterStakeLocation | undefined>(() => {
    if (!data || effectiveRollups.length === 0) return undefined
    const matches: AttesterStakeLocation[] = []
    for (let i = 0; i < effectiveRollups.length; i++) {
      const rollup = effectiveRollups[i]
      const result = data[i]
      if (result?.status !== "success") continue
      const view = result.result as { status: number } | undefined
      if (!view || view.status === STATUS_NONE) continue
      matches.push({
        rollupAddress: rollup.address,
        rollupVersion: rollup.version,
        status: view.status,
      })
    }
    if (matches.length === 0) return undefined
    // Prefer the canonical rollup if the attester is active on it.
    if (canonical) {
      const onCanonical = matches.find((m) => m.rollupAddress.toLowerCase() === canonical.address.toLowerCase())
      if (onCanonical) return onCanonical
    }
    // Otherwise return the latest non-canonical match (registry order = oldest → newest, so last is latest).
    return matches[matches.length - 1]
  }, [data, effectiveRollups, canonical])

  return {
    location,
    isLoading: isLoading || isLoadingRegistry,
    error: error ?? registryError,
  }
}
