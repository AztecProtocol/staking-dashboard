import { useState, useMemo } from "react"
import { Icon } from "@/components/Icon"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { useStakerImplementation as useStakerImplementationFromStaker } from "@/hooks/staker/useStakerImplementation"
import { AddressDisplay } from "@/components/AddressDisplay"
import { TooltipIcon } from "@/components/Tooltip"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { buildUpgradeStakerEntry } from "@/utils/actionCart"
import { getVersionByImplementation, getImplementationDescription } from "@/utils/stakerVersion"
import type { ATPData } from "@/hooks/atp"
import type { Address } from "viem"

interface ATPDetailsTechnicalInfoProps {
  atp: ATPData
  // Kept for source-compatibility; cart execution drives refetch globally.
  onUpgradeSuccess?: () => void
}

/**
 * Component displaying technical details of a Token Vault position
 * Shows vault address, and staker information if staker contract exists
 */
export const ATPDetailsTechnicalInfo = ({ atp }: ATPDetailsTechnicalInfoProps) => {
  const [isTechnicalDetailsExpanded, setIsTechnicalDetailsExpanded] = useState(true)
  const { addTransaction, checkStepGroupInQueue, openCart } = useTransactionCart()

  const { implementation: stakerImplementation, isLoading: isLoadingImplementation } = useStakerImplementationFromStaker(
    atp.staker as Address
  )

  const { stakerVersions } = useAtpRegistryData({
    registryAddress: atp.registry
  })
  const { implementations, isLoading: isLoadingImplementations } = useStakerImplementations(stakerVersions, atp.registry)

  const stakerVersion = useMemo(() => {
    return getVersionByImplementation(stakerImplementation, implementations)
  }, [stakerImplementation, implementations])

  const latestVersion = useMemo(() => {
    const stakingVersions = stakerVersions.filter(version => version > 0n)
    if (stakingVersions.length > 0) {
      return stakingVersions[stakingVersions.length - 1]
    }
    return null
  }, [stakerVersions])

  const currentDescription = useMemo(() => {
    return getImplementationDescription(stakerImplementation, stakerVersion!)
  }, [stakerImplementation, stakerVersion])

  const isOnLatestVersion = stakerVersion !== null && latestVersion !== null && stakerVersion === latestVersion
  const isLoadingVersion = isLoadingImplementation || isLoadingImplementations

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

  return (
    <div className="mb-6 border-t border-parchment/10 pt-4">
      <button
        onClick={() => setIsTechnicalDetailsExpanded(!isTechnicalDetailsExpanded)}
        className="w-full flex items-center justify-between p-3 glass hover:bg-parchment/10 transition-colors mb-3"
      >
        <div className="text-sm text-parchment font-oracle-standard font-bold uppercase tracking-wide">
          Details
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-parchment/70 font-oracle-standard font-bold uppercase">
            {isTechnicalDetailsExpanded ? 'Hide' : 'Expand'}
          </span>
          <Icon
            name="chevronDown"
            size="md"
            className={`text-parchment transition-transform ${isTechnicalDetailsExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isTechnicalDetailsExpanded && (
        <div className="p-4 space-y-4">
          <div className={`grid gap-4 ${atp.staker ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <AddressDisplay
              address={atp.atpAddress}
              label="VAULT ADDRESS"
              tooltip="Smart contract address of this Token Vault. Use this address to interact with this vault on-chain."
            />

            {atp.operator && atp.beneficiary && atp.operator.toLowerCase() !== atp.beneficiary.toLowerCase() && (
              <AddressDisplay
                address={atp.operator}
                label="OPERATOR ADDRESS"
                tooltip="The operator address that has been delegated to manage this Token Vault's staking operations."
              />
            )}

            {atp.staker && (
              <>
                <AddressDisplay
                  address={atp.staker}
                  label="STAKER CONTRACT"
                  tooltip="The smart contract managing your stake. Upgrading the staker contract is necessary to benefit from protocol improvements and new governance features."
                />

                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="text-xs text-parchment/60 uppercase tracking-wide">STAKER VERSION</div>
                    <TooltipIcon
                      content="Your Token Vault talks to a staker contract to handle staking, delegation, unstaking and rewards. Governance makes this contract available and it is recommended that every Token Vault upgrades to the latest one."
                      size="sm"
                      maxWidth="max-w-md"
                    />
                  </div>
                  {isLoadingVersion ? (
                    <div className="text-sm text-parchment/50">Loading...</div>
                  ) : isOnLatestVersion ? (
                    <>
                      <div className="text-sm text-accent font-medium">Latest</div>
                      <div className="text-xs text-parchment/60 mt-1">{currentDescription}</div>
                    </>
                  ) : (
                    <>
                      {isUpgradeQueued ? (
                        <button
                          onClick={openCart}
                          className="bg-parchment/10 border border-parchment/20 text-accent py-2 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/15 transition-all flex items-center gap-1 rounded-btn"
                        >
                          <Icon name="shoppingCart" size="sm" />
                          In Batch
                        </button>
                      ) : (
                        <button
                          onClick={handleUpgrade}
                          disabled={!upgradeEntry}
                          className="btn-lime py-2 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Upgrade to Latest
                        </button>
                      )}
                      <div className="text-xs text-parchment/60 mt-1">{currentDescription}</div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
