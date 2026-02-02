import { useState, useMemo, useEffect } from "react"
import { Icon } from "@/components/Icon"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { useStakerImplementation as useStakerImplementationFromStaker } from "@/hooks/staker/useStakerImplementation"
import { useUpgradeStaker } from "@/hooks/atp"
import { AddressDisplay } from "@/components/AddressDisplay"
import { TooltipIcon } from "@/components/Tooltip"
import { getVersionByImplementation, getImplementationDescription } from "@/utils/stakerVersion"
import type { ATPData } from "@/hooks/atp"
import type { Address } from "viem"

interface ATPDetailsTechnicalInfoProps {
  atp: ATPData
  onUpgradeSuccess?: () => void
}

/**
 * Component displaying technical details of a Token Vault position
 * Shows vault address, and staker information if staker contract exists
 */
export const ATPDetailsTechnicalInfo = ({ atp, onUpgradeSuccess }: ATPDetailsTechnicalInfoProps) => {
  const [isTechnicalDetailsExpanded, setIsTechnicalDetailsExpanded] = useState(true)

  const { implementation: stakerImplementation, isLoading: isLoadingImplementation, refetch } = useStakerImplementationFromStaker(
    atp.staker as Address
  )

  const { stakerVersions } = useAtpRegistryData({
    registryAddress: atp.registry
  })
  const { implementations, isLoading: isLoadingImplementations } = useStakerImplementations(stakerVersions, atp.registry)
  const upgradeStakerHook = useUpgradeStaker(atp.atpAddress as Address)

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

  useEffect(() => {
    if (upgradeStakerHook.isSuccess) {
      refetch()
      onUpgradeSuccess?.()
    }
  }, [upgradeStakerHook.isSuccess, refetch, onUpgradeSuccess])

  const isOnLatestVersion = stakerVersion !== null && latestVersion !== null && stakerVersion === latestVersion
  const isLoadingVersion = isLoadingImplementation || isLoadingImplementations

  const handleUpgrade = async () => {
    if (!latestVersion) return
    try {
      await upgradeStakerHook.upgradeStaker(latestVersion)
    } catch (error) {
      console.error('Failed to upgrade staker:', error)
    }
  }

  return (
    <div className="mb-6 border-t border-parchment/10 pt-4">
      <button
        onClick={() => setIsTechnicalDetailsExpanded(!isTechnicalDetailsExpanded)}
        className="w-full flex items-center justify-between p-3 bg-parchment/10 border border-parchment/20 hover:bg-parchment/20 transition-colors mb-3"
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
                      <div className="text-sm text-chartreuse font-medium">Latest</div>
                      <div className="text-xs text-parchment/60 mt-1">{currentDescription}</div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleUpgrade}
                        disabled={upgradeStakerHook.isPending || upgradeStakerHook.isConfirming}
                        className="bg-chartreuse text-ink py-2 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {upgradeStakerHook.isPending
                          ? "Confirm in Wallet..."
                          : upgradeStakerHook.isConfirming
                            ? "Upgrading..."
                            : `Upgrade to Latest`}
                      </button>
                      <div className="text-xs text-parchment/60 mt-1">{currentDescription}</div>
                    </>
                  )}
                  {upgradeStakerHook.error && (
                    <div className="text-xs text-vermillion mt-1">
                      {upgradeStakerHook.error.message.includes('rejected') ? 'Transaction cancelled' : 'Upgrade failed'}
                    </div>
                  )}
                  {upgradeStakerHook.isSuccess && (
                    <div className="text-xs text-chartreuse mt-1">
                      Successfully upgraded to latest version
                    </div>
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
