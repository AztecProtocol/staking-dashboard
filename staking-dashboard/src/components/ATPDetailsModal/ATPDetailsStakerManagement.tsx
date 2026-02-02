import { useState, useMemo, useEffect } from "react"
import type { Address } from "viem"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { useStakerImplementation as useStakerImplementationFromStaker } from "@/hooks/staker/useStakerImplementation"
import { useUpgradeStaker } from "@/hooks/atp"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import {
  getVersionByImplementation,
  getImplementationDescription,
  getImplementationForVersion
} from "@/utils/stakerVersion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ATPData } from "@/hooks/atp"

interface ATPDetailsStakerManagementProps {
  atp: ATPData
}

/**
 * Combined component for staker version management and balance operations
 * Shows version info, upgrade options, staker balance, and fund transfer
 */
export const ATPDetailsStakerManagement = ({ atp }: ATPDetailsStakerManagementProps) => {
  const [selectedVersion, setSelectedVersion] = useState<bigint | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Get current implementation
  const {
    implementation: currentImplementation,
    isLoading: isLoadingImplementation,
    refetch: refetchImplementation
  } = useStakerImplementationFromStaker(atp.staker as Address)

  // Get available versions
  const { stakerVersions } = useAtpRegistryData({
    registryAddress: atp.registry
  })
  const { implementations, isLoading: isLoadingImplementations } = useStakerImplementations(stakerVersions, atp.registry)

  // Staker operations
  const upgradeStakerHook = useUpgradeStaker(atp.atpAddress as Address)

  // Get current version number
  const currentVersion = useMemo(() => {
    return getVersionByImplementation(currentImplementation, implementations)
  }, [currentImplementation, implementations])

  // Auto-select current version or latest
  useEffect(() => {
    if (!selectedVersion && stakerVersions.length > 0 && !isLoadingImplementation) {
      if (currentVersion && currentVersion > 0n) {
        setSelectedVersion(currentVersion)
      } else {
        const stakingVersions = stakerVersions.filter(version => version > 0n)
        if (stakingVersions.length > 0) {
          const latestVersion = stakingVersions[stakingVersions.length - 1]
          setSelectedVersion(latestVersion)
        }
      }
    }
  }, [selectedVersion, currentVersion, stakerVersions, isLoadingImplementation])

  // Refetch implementation after successful upgrade
  useEffect(() => {
    if (upgradeStakerHook.isSuccess) {
      refetchImplementation()
    }
  }, [upgradeStakerHook.isSuccess, refetchImplementation])

  const handleVersionChange = (value: string) => {
    setSelectedVersion(BigInt(value))
  }

  const handleUpgrade = async () => {
    if (!selectedVersion) return
    try {
      await upgradeStakerHook.upgradeStaker(selectedVersion)
    } catch (error) {
      console.error('Failed to upgrade staker:', error)
    }
  }

  const isLoading = isLoadingImplementation || isLoadingImplementations
  const canUpgrade = selectedVersion !== null && selectedVersion !== currentVersion && selectedVersion > 0n

  // Don't show if no staker
  if (!atp.staker) return null

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-parchment/5 border border-parchment/20 p-4 flex items-center justify-between hover:bg-parchment/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
            Staker Version
          </h3>
          <TooltipIcon
            content="Upgrade your staker contract to access new features and improvements"
            size="sm"
            maxWidth="max-w-xs"
          />
        </div>
        <Icon
          name="chevronDown"
          size="lg"
          className={`text-parchment/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="bg-parchment/5 border border-parchment/20 border-t-0 p-4 space-y-6">
          {isLoading ? (
            <div className="text-sm text-parchment/50">Loading information...</div>
          ) : (
            <>
              {/* Available Versions */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 mb-2">
                  <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                    Available Versions
                  </div>
                  <TooltipIcon
                    content="All staker contract versions available on the network. Different versions provide different capabilities for staking and withdrawal operations."
                    size="sm"
                    maxWidth="max-w-xs"
                  />
                </div>
                <div className="space-y-2">
                  {stakerVersions.map((version, index) => {
                    const versionNum = Number(version)
                    const implementation = getImplementationForVersion(version, implementations)
                    const description = getImplementationDescription(implementation, version)
                    const isLatest = index === stakerVersions.length - 1
                    const isCurrent = version === currentVersion
                    const isDisabled = versionNum === 0

                    // Generate tooltip content based on version/description
                    const tooltipContent = isDisabled
                      ? 'Default staker version with staking disabled. ATP cannot stake any funds until upgraded to a higher version that supports staking operations.'
                      : description.includes('cannot withdraw')
                      ? 'Non-withdrawable staker: Once tokens are staked to sequencers or delegated to providers, they cannot be unstaked. Funds remain locked in the staking position.'
                      : description.includes('both stake and withdraw')
                      ? 'Withdrawable staker: Tokens can be staked to sequencers or delegated, and can also be unstaked at any time, providing maximum flexibility.'
                      : `Implementation: ${implementation}`

                    return (
                      <div
                        key={version.toString()}
                        className={`flex items-center justify-between p-2 border ${
                          isCurrent
                            ? isDisabled
                              ? 'border-vermillion/40 bg-vermillion/5'
                              : 'border-chartreuse/40 bg-chartreuse/5'
                            : isDisabled
                            ? 'border-parchment/10 bg-parchment/5'
                            : 'border-parchment/20 bg-parchment/5'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`font-mono text-sm font-bold ${
                            isCurrent
                              ? isDisabled ? 'text-vermillion' : 'text-chartreuse'
                              : isDisabled ? 'text-parchment/40' : 'text-parchment'
                          }`}>
                            v{version.toString()}
                          </span>
                          <span className={`text-xs ${isDisabled ? 'text-parchment/40' : 'text-parchment/60'}`}>
                            {description}
                          </span>
                          <TooltipIcon
                            content={tooltipContent}
                            size="sm"
                            maxWidth="max-w-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {isLatest && !isDisabled && (
                            <span className="text-[10px] uppercase font-oracle-standard font-bold text-chartreuse">
                              Latest
                            </span>
                          )}
                          {isCurrent && (
                            <span className={`text-[10px] uppercase font-oracle-standard font-bold ${isDisabled ? 'text-vermillion' : 'text-aqua'}`}>
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Version Management */}
              <div className="space-y-3">
                <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard mb-2">
                  Upgrade
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={selectedVersion?.toString() || ""}
                      onValueChange={handleVersionChange}
                      disabled={upgradeStakerHook.isPending || upgradeStakerHook.isConfirming}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stakerVersions.map((version, index) => {
                          const implementation = getImplementationForVersion(version, implementations)
                          const description = getImplementationDescription(implementation)
                          const isLatest = index === stakerVersions.length - 1
                          return (
                            <SelectItem key={version.toString()} value={version.toString()}>
                              <span className="font-mono">v{version.toString()}</span>
                              <span className="text-parchment/60"> - {description}</span>
                              {isLatest && <span className="text-chartreuse"> (Latest)</span>}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {canUpgrade && (
                    <button
                      onClick={handleUpgrade}
                      disabled={upgradeStakerHook.isPending || upgradeStakerHook.isConfirming}
                      className="bg-chartreuse text-ink py-2 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {upgradeStakerHook.isPending
                        ? "Confirming..."
                        : upgradeStakerHook.isConfirming
                        ? "Upgrading..."
                        : "Upgrade"}
                    </button>
                  )}
                </div>

                {upgradeStakerHook.error && (
                  <div className="text-xs text-vermillion">
                    {upgradeStakerHook.error.message.includes('rejected') ? 'Transaction cancelled' : 'Upgrade failed'}
                  </div>
                )}

                {upgradeStakerHook.isSuccess && (
                  <div className="text-xs text-chartreuse">
                    Successfully upgraded to v{selectedVersion?.toString()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
