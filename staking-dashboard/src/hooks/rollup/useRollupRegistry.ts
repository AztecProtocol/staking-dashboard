import { useMemo } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import { contracts } from "@/contracts"
import type { Address } from "viem"

/**
 * One discovered rollup instance from the Aztec governance Registry.
 */
export interface RollupInstance {
  version: bigint
  address: Address
}

/**
 * Discovers all rollup instances from the Aztec governance Registry contract.
 *
 * The Registry address is read lazily from `stakingRegistry.ROLLUP_REGISTRY()` so no env var
 * is required. The hook then enumerates `numberOfVersions()` and multicalls
 * `getVersion(i)` + `getRollup(version)` to build the full list. The canonical rollup is read
 * via `getCanonicalRollup()`.
 *
 * `isStale` is true when the configured `VITE_ROLLUP_ADDRESS` no longer matches the canonical
 * rollup — this is what surfaces the "your dashboard is pinned to an old rollup" banner.
 *
 * Cached forever (`staleTime: Infinity`); the list only changes when governance rotates a rollup,
 * which is extremely rare.
 */
export function useRollupRegistry() {
  // Step 1: discover the rollup registry address via the staking registry.
  const registryAddressQuery = useReadContract({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "ROLLUP_REGISTRY",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  const registryAddress = registryAddressQuery.data as Address | undefined

  // Step 2: enumerate counts + canonical from the registry.
  const headerQuery = useReadContracts({
    contracts: registryAddress
      ? [
          {
            abi: contracts.rollupRegistry.abi,
            address: registryAddress,
            functionName: "numberOfVersions",
          } as const,
          {
            abi: contracts.rollupRegistry.abi,
            address: registryAddress,
            functionName: "getCanonicalRollup",
          } as const,
        ]
      : undefined,
    query: {
      enabled: !!registryAddress,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  const numberOfVersions = headerQuery.data?.[0].result as bigint | undefined
  const canonicalAddress = headerQuery.data?.[1].result as Address | undefined

  // Step 3: enumerate version numbers via getVersion(i).
  const versionIndexes = useMemo(() => {
    if (!numberOfVersions) return []
    const out: bigint[] = []
    for (let i = 0n; i < numberOfVersions; i++) out.push(i)
    return out
  }, [numberOfVersions])

  const versionsQuery = useReadContracts({
    contracts:
      registryAddress && versionIndexes.length > 0
        ? versionIndexes.map(
            (i) =>
              ({
                abi: contracts.rollupRegistry.abi,
                address: registryAddress,
                functionName: "getVersion",
                args: [i],
              }) as const,
          )
        : undefined,
    query: {
      enabled: !!registryAddress && versionIndexes.length > 0,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  // Step 4: resolve each version → rollup address via getRollup(version).
  const versions = useMemo(() => {
    if (!versionsQuery.data) return [] as bigint[]
    return versionsQuery.data
      .map((entry) => entry.result as bigint | undefined)
      .filter((v): v is bigint => v !== undefined)
  }, [versionsQuery.data])

  const rollupsQuery = useReadContracts({
    contracts:
      registryAddress && versions.length > 0
        ? versions.map(
            (version) =>
              ({
                abi: contracts.rollupRegistry.abi,
                address: registryAddress,
                functionName: "getRollup",
                args: [version],
              }) as const,
          )
        : undefined,
    query: {
      enabled: !!registryAddress && versions.length > 0,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  // Combine versions + addresses into the discovered list.
  const rollups = useMemo<RollupInstance[]>(() => {
    if (!rollupsQuery.data || versions.length === 0) return []
    const out: RollupInstance[] = []
    for (let i = 0; i < versions.length; i++) {
      const address = rollupsQuery.data[i]?.result as Address | undefined
      if (!address) continue
      out.push({ version: versions[i], address })
    }
    return out
  }, [rollupsQuery.data, versions])

  const canonical = useMemo<RollupInstance | undefined>(() => {
    if (!canonicalAddress) return undefined
    // The canonical address is authoritative; pair it with the matching version from the
    // enumerated list (or the last version, which mirrors the registry's storage layout).
    const match = rollups.find((r) => r.address.toLowerCase() === canonicalAddress.toLowerCase())
    if (match) return match
    return rollups.length > 0 ? rollups[rollups.length - 1] : undefined
  }, [canonicalAddress, rollups])

  const configuredAddress = contracts.rollup.address
  const configured = useMemo<RollupInstance | undefined>(() => {
    return rollups.find((r) => r.address.toLowerCase() === configuredAddress.toLowerCase())
  }, [rollups, configuredAddress])

  const isStale =
    !!canonical &&
    canonical.address.toLowerCase() !== configuredAddress.toLowerCase()

  const isLoading =
    registryAddressQuery.isLoading ||
    headerQuery.isLoading ||
    versionsQuery.isLoading ||
    rollupsQuery.isLoading

  const error =
    registryAddressQuery.error ||
    headerQuery.error ||
    versionsQuery.error ||
    rollupsQuery.error ||
    null

  return {
    registryAddress,
    rollups,
    canonical,
    configured,
    configuredAddress,
    isStale,
    isLoading,
    error,
  }
}
