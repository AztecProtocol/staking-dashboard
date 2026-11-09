import { useState, useMemo, useEffect } from "react"
import type { Address } from "viem"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { useStakerImplementation as useStakerImplementationFromStaker } from "@/hooks/staker/useStakerImplementation"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { buildUpgradeStakerEntry } from "@/utils/actionCart"
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
  const { addTransaction, checkStepGroupInQueue, openCart } = useTransactionCart()

  // Get current implementation
  const {
    implementation: currentImplementation,
    isLoading: isLoadingImplementation,
  } = useStakerImplementationFromStaker(atp.staker as Address)

  // Get available versions
  const { stakerVersions } = useAtpRegistryData({
    registryAddress: atp.registry
  })
  const { implementations, isLoading: isLoadingImplementations } = useStakerImplementations(stakerVersions, atp.registry)

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

  const upgradeEntry = useMemo(() => {
    if (!selectedVersion) return undefined
    return buildUpgradeStakerEntry({ atpAddress: atp.atpAddress as Address, version: selectedVersion })
  }, [selectedVersion, atp.atpAddress])

  const isUpgradeQueued = !!upgradeEntry && !!upgradeEntry.metadata?.stepType &&
    !!upgradeEntry.metadata?.stepGroupIdentifier &&
    checkStepGroupInQueue(upgradeEntry.metadata.stepType, upgradeEntry.metadata.stepGroupIdentifier)

  const handleVersionChange = (value: string) => {
    setSelectedVersion(BigInt(value))
  }

  const handleUpgrade = () => {
    if (!upgradeEntry) return
    addTransaction(upgradeEntry, { preventDuplicate: true })
    openCart()
  }

  const isLoading = isLoadingImplementation || isLoadingImplementations
  const canUpgrade = selectedVersion !== null && selectedVersion !== currentVersion && selectedVersion > 0n

  // Don't show if no staker
  if (!atp.staker) return null

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass p-4 flex items-center justify-between hover:bg-parchment/10 transition-colors"
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
        <div className="glass border-t-0 p-4 space-y-6">
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
                        className={`flex items-center justify-between p-2 border rounded-inset ${
                          isCurrent
                            ? isDisabled
                              ? 'border-vermillion/40 bg-vermillion/5'
                              : 'border-parchment/20 bg-parchment/5'
                            : isDisabled
                            ? 'border-parchment/10 bg-parchment/5'
                            : 'border-parchment/20 bg-parchment/5'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`font-mono text-sm font-bold ${
                            isCurrent
                              ? isDisabled ? 'text-vermillion' : 'text-accent'
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
                            <span className="text-[10px] uppercase font-oracle-standard font-bold text-accent">
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
                              {isLatest && <span className="text-accent"> (Latest)</span>}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {canUpgrade && (
                    isUpgradeQueued ? (
                      <button
                        onClick={openCart}
                        className="bg-parchment/10 border border-parchment/20 text-accent py-2 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/15 transition-all whitespace-nowrap flex items-center gap-1 rounded-btn"
                      >
                        <Icon name="shoppingCart" size="sm" />
                        In Batch
                      </button>
                    ) : (
                      <button
                        onClick={handleUpgrade}
                        className="btn-lime py-2 px-3 text-xs whitespace-nowrap"
                      >
                        Add to Batch
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
