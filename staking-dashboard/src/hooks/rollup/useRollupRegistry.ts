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
 * Discovers all rollup instances from the Aztec governance Registry.
 * Enumerates versions via `numberOfVersions()` + `getVersion(i)` + `getRollup(version)`.
 * `isStale` is true when the configured rollup differs from the canonical one.
 */
export function useRollupRegistry() {
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
