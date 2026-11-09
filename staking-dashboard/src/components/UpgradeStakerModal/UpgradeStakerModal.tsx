import { useMemo } from "react"
import type { Address } from "viem"
import { formatEther } from "viem"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { useStakerImplementation } from "@/hooks/staker/useStakerImplementation"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { buildUpgradeStakerEntry } from "@/utils/actionCart"
import {
  getVersionByImplementation,
  getImplementationDescription,
  getImplementationForVersion
} from "@/utils/stakerVersion"
import { formatAddress } from "@/utils/formatAddress"
import type { ATPData } from "@/hooks/atp"

interface UpgradeStakerModalProps {
  isOpen: boolean
  onClose: () => void
  atp: ATPData
  // Kept for source-compatibility; cart execution drives refetch globally.
  onSuccess?: () => void
}

export const UpgradeStakerModal = ({
  isOpen,
  onClose,
  atp,
}: UpgradeStakerModalProps) => {
  const { addTransaction, checkStepGroupInQueue, openCart } = useTransactionCart()

  // Get current implementation from staker contract
  const {
    implementation: currentImplementation,
    isLoading: isLoadingImplementation,
  } = useStakerImplementation(atp.staker as Address)

  // Get available versions from registry
  const { stakerVersions } = useAtpRegistryData({
    registryAddress: atp.registry
  })
  const { implementations, isLoading: isLoadingImplementations } = useStakerImplementations(stakerVersions, atp.registry)

  // Get current version number
  const currentVersion = useMemo(() => {
    return getVersionByImplementation(currentImplementation, implementations)
  }, [currentImplementation, implementations])

  // Get latest version (last version that supports staking, i.e., > 0)
  const latestVersion = useMemo(() => {
    const stakingVersions = stakerVersions.filter(v => v > 0n)
    return stakingVersions.length > 0 ? stakingVersions[stakingVersions.length - 1] : null
  }, [stakerVersions])

  // Get latest implementation description
  const latestImplementation = latestVersion !== null
    ? getImplementationForVersion(latestVersion, implementations)
    : undefined
  const latestDescription = getImplementationDescription(latestImplementation, latestVersion ?? undefined)

  const upgradeEntry = useMemo(() => {
    if (!latestVersion) return undefined
    return buildUpgradeStakerEntry({ atpAddress: atp.atpAddress as Address, version: latestVersion })
  }, [latestVersion, atp.atpAddress])

  const isUpgradeQueued = !!upgradeEntry && !!upgradeEntry.metadata?.stepType &&
    !!upgradeEntry.metadata?.stepGroupIdentifier &&
    checkStepGroupInQueue(upgradeEntry.metadata.stepType, upgradeEntry.metadata.stepGroupIdentifier)

  const handleUpgrade = () => {
    if (!upgradeEntry) return
    addTransaction(upgradeEntry, { preventDuplicate: true })
    openCart()
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  const isLoading = isLoadingImplementation || isLoadingImplementations
  const needsUpgrade = currentVersion === null || currentVersion === 0n || (latestVersion !== null && currentVersion < latestVersion)
  const isAlreadyLatest = latestVersion !== null && currentVersion === latestVersion

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content-base max-w-lg w-[90%]"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose}>
          ×
        </button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="font-arizona-serif text-2xl font-medium text-accent mb-2">
              Set Staker Version
            </h2>
            <p className="text-sm text-parchment/70">
              Upgrade your staker contract to enable staking and unlock features.
              It is recommended that every Token Vault upgrades to the latest version.
            </p>
          </div>

          {/* ATP Info */}
          <div className="glass p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                Token Vault
              </span>
              <span className="font-mono text-sm text-parchment">
                #{atp.sequentialNumber || '?'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                Allocation
              </span>
              <span className="font-mono text-sm text-parchment">
                {atp.allocation ? Number(formatEther(atp.allocation)).toLocaleString() : '0'} AZTEC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                ATP Address
              </span>
              <span className="font-mono text-sm text-parchment">
                {formatAddress(atp.atpAddress)}
              </span>
            </div>
          </div>

          {/* Version Info */}
          {isLoading ? (
            <div className="text-sm text-parchment/50 text-center py-4">
              Loading version information...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Version */}
              <div className="flex justify-between items-center p-3 glass">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                    Current Version
                  </span>
                  <TooltipIcon
                    content="The version of your staker contract currently deployed"
                    size="sm"
                  />
                </div>
                <span className={`font-mono text-sm font-bold ${
                  currentVersion === null || currentVersion === 0n
                    ? 'text-vermillion'
                    : 'text-parchment'
                }`}>
                  {currentVersion === null || currentVersion === 0n
                    ? 'v0 (Staking Disabled)'
                    : `v${currentVersion.toString()}`
                  }
                </span>
              </div>

              {/* Latest Version */}
              <div className="flex justify-between items-center p-3 bg-parchment/5 border border-parchment/20 rounded-inset">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                    Latest Version
                  </span>
                  <TooltipIcon
                    content={latestDescription}
                    size="sm"
                  />
                </div>
                <span className="font-mono text-sm font-bold text-accent">
                  {latestVersion !== null ? `v${latestVersion.toString()}` : 'N/A'}
                </span>
              </div>

              {/* Upgrade Button / Status */}
              {isAlreadyLatest ? (
                <div className="bg-aqua/10 border border-aqua/40 p-4 text-center rounded-inset">
                  <span className="text-aqua font-oracle-standard font-bold text-sm">
                    Already on latest version
                  </span>
                </div>
              ) : needsUpgrade && latestVersion !== null ? (
                isUpgradeQueued ? (
                  <button
                    onClick={openCart}
                    className="w-full bg-parchment/10 border border-parchment/20 text-accent py-3 px-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/15 transition-all flex items-center justify-center gap-2 rounded-btn"
                  >
                    <Icon name="shoppingCart" size="sm" />
                    In Batch — Open Cart
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    className="w-full btn-lime py-3 px-4 text-sm"
                  >
                    Add upgrade to v{latestVersion.toString()} to batch
                  </button>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpgradeStakerModal
