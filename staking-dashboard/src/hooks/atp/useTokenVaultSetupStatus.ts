import { useMemo, useCallback } from "react"
import type { Address } from "viem"
import { useAccount } from "wagmi"
import { useStakerImplementation } from "@/hooks/staker/useStakerImplementation"
import { useStakerOperator } from "@/hooks/staker/useStakerOperator"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { getVersionByImplementation } from "@/utils/stakerVersion"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

interface UseTokenVaultSetupStatusParams {
  stakerAddress: Address | undefined
  atpAddress: Address | undefined
  registryAddress: Address | undefined
  atpType: string | undefined
  enabled?: boolean
}

/**
 * Hook to determine if an NCATP needs setup before it can be used.
 * Setup is required when:
 * 1. ATP type is NCATP
 * 2. AND (Staker Version === 0 OR Operator === zero address)
 */
export function useTokenVaultSetupStatus({
  stakerAddress,
  registryAddress,
  atpType,
  enabled = true
}: UseTokenVaultSetupStatusParams) {
  const { address: connectedAddress } = useAccount()

  const isEnabled = enabled && !!stakerAddress

  // Get current staker implementation
  const { implementation: currentImplementation, isLoading: isLoadingImpl, refetch: refetchImpl } =
    useStakerImplementation(stakerAddress as Address)

  // Get available staker versions from registry
  const { stakerVersions, isLoading: isLoadingRegistry } = useAtpRegistryData({
    registryAddress
  })

  // Get implementation addresses for versions
  const { implementations, isLoading: isLoadingVersions } =
    useStakerImplementations(stakerVersions, registryAddress)

  // Get current operator
  const { operator: currentOperator, isLoading: isLoadingOperator, refetch: refetchOperator } =
    useStakerOperator(stakerAddress as Address)

  // Check if this is an NCATP
  const isNCATP = atpType === "NCATP"

  // Get latest staking version (> 0)
  const latestVersion = useMemo(() => {
    const stakingVersions = stakerVersions.filter((v) => v > 0n)
    return stakingVersions.length > 0 ? stakingVersions[stakingVersions.length - 1] : null
  }, [stakerVersions])

  // Get current version number
  const currentVersion = useMemo(() => {
    return getVersionByImplementation(currentImplementation, implementations)
  }, [currentImplementation, implementations])

  // Check if staker upgrade needed (version === 0 means staking disabled)
  const needsStakerUpgrade = useMemo(() => {
    if (currentVersion === null) return false // Still loading
    return currentVersion === 0n
  }, [currentVersion])

  // Check if staker upgrade is available (current version > 0 but less than latest)
  const hasUpgradeAvailable = useMemo(() => {
    if (currentVersion === null || latestVersion === null) return false
    return currentVersion < latestVersion && currentVersion > 0n
  }, [currentVersion, latestVersion])

  // Check if operator update needed (zero address means not set)
  const needsOperatorUpdate = useMemo(() => {
    if (!currentOperator) return false // Still loading
    return currentOperator.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  }, [currentOperator])

  // Setup is needed only for NCATPs with version 0 or zero operator
  const needsSetup = isEnabled && isNCATP && (needsStakerUpgrade || needsOperatorUpdate)

  const isLoading = isLoadingImpl || isLoadingRegistry || isLoadingVersions || isLoadingOperator

  // Refetch function to refresh setup status after transactions complete
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchImpl(),
      refetchOperator()
    ])
  }, [refetchImpl, refetchOperator])

  return {
    needsSetup,
    needsStakerUpgrade,
    needsOperatorUpdate,
    hasUpgradeAvailable,
    currentVersion,
    latestVersion,
    currentOperator,
    connectedAddress,
    isNCATP,
    isLoading,
    refetch
  }
}
