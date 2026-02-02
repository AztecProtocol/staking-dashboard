import { useMemo, useCallback } from "react"
import type { Address } from "viem"
import { useReadContract, useAccount } from "wagmi"
import { useStakerImplementation } from "./useStakerImplementation"
import { useStakerOperator } from "./useStakerOperator"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { getVersionByImplementation } from "@/utils/stakerVersion"
import { CommonATPAbi } from "@/contracts/abis/ATP"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

interface UseStakerGovernanceSupportParams {
  stakerAddress: Address | undefined
  atpAddress: Address | undefined
  enabled?: boolean
}

/**
 * Hook to check if a staker supports governance functions (depositIntoGovernance, etc.)
 *
 * Governance support logic:
 * - ONLY the latest staker version supports governance deposits
 * - This encourages users to always stay on the latest version
 * - If not on latest version, user should upgrade to use governance features
 *
 * NOTE: The registry is fetched from the ATP contract itself to ensure
 * we check the correct registry (regular vs auction)
 */
export function useStakerGovernanceSupport({
  stakerAddress,
  atpAddress,
  enabled = true
}: UseStakerGovernanceSupportParams) {
  const { address: connectedAddress } = useAccount()

  // Get the registry address from the ATP contract itself
  const { data: registryAddress, isLoading: isLoadingRegistryAddress } = useReadContract({
    abi: CommonATPAbi,
    address: atpAddress,
    functionName: "getRegistry",
    query: {
      enabled: enabled && !!atpAddress
    }
  })

  // Get current staker implementation (hook internally handles undefined via its enabled check)
  const { implementation: currentImplementation, isLoading: isLoadingImpl, refetch: refetchImplementation } =
    useStakerImplementation((enabled && stakerAddress) ? stakerAddress : undefined as unknown as Address)

  // Get current operator
  const { operator: currentOperator, isLoading: isLoadingOperator, refetch: refetchOperator } =
    useStakerOperator((enabled && stakerAddress) ? stakerAddress : undefined as unknown as Address)

  // Get available staker versions from registry (uses the ATP's actual registry)
  const { stakerVersions, isLoading: isLoadingRegistry } = useAtpRegistryData({
    registryAddress: registryAddress as Address | undefined
  })

  // Get implementation addresses for versions
  const { implementations, isLoading: isLoadingVersions } =
    useStakerImplementations(stakerVersions, registryAddress)

  // Get current version number
  const currentVersion = useMemo(() => {
    return getVersionByImplementation(currentImplementation, implementations)
  }, [currentImplementation, implementations])

  // Get latest staking version (> 0, meaning not the disabled default)
  const latestVersion = useMemo(() => {
    const stakingVersions = stakerVersions.filter((v) => v > 0n)
    return stakingVersions.length > 0 ? stakingVersions[stakingVersions.length - 1] : null
  }, [stakerVersions])

  // Check if current staker supports governance (version > 0)
  // Version 0 is the default/disabled staker - doesn't support governance
  const supportsGovernance = useMemo(() => {
    if (currentVersion === null) return false // Still loading
    return currentVersion > 0n
  }, [currentVersion])

  // Check if on the latest version
  const isOnLatestVersion = useMemo(() => {
    if (currentVersion === null || latestVersion === null) return false
    return currentVersion === latestVersion
  }, [currentVersion, latestVersion])

  // Check if upgrade is available (current version < latest version)
  const upgradeAvailable = useMemo(() => {
    if (currentVersion === null || latestVersion === null) return false
    return currentVersion < latestVersion
  }, [currentVersion, latestVersion])

  // Check if operator update needed (zero address means not set)
  const needsOperatorUpdate = useMemo(() => {
    if (!currentOperator) return false // Still loading
    return currentOperator.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  }, [currentOperator])

  const isLoading = isLoadingRegistryAddress || isLoadingImpl || isLoadingRegistry || isLoadingVersions || isLoadingOperator

  // Refetch function to update staker implementation and operator after changes
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchImplementation(),
      refetchOperator()
    ])
  }, [refetchImplementation, refetchOperator])

  return {
    supportsGovernance,       // true if version > 0 (can deposit to governance)
    isOnLatestVersion,        // true if on the latest version (no warning needed)
    needsOperatorUpdate,      // true if operator is zero address
    currentImplementation,
    currentOperator,
    connectedAddress,         // to use as the operator when setting
    currentVersion,
    latestVersion,
    upgradeAvailable,         // true if there's a newer version available
    isLoading,
    refetch                   // call after upgrade/operator update to refresh
  }
}
