import { useState, useMemo, useEffect } from "react"
import type { Address } from "viem"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useAtpRegistryData, useStakerImplementations } from "@/hooks/atpRegistry"
import { useStakerImplementation } from "@/hooks/staker/useStakerImplementation"
import { useStakerOperator } from "@/hooks/staker/useStakerOperator"
import { useUpgradeStaker, useUpdateStakerOperator } from "@/hooks/atp"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { ATPStakingStepsWithTransaction, buildConditionalDependencies } from "@/contexts/ATPStakingStepsContext"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import {
  getVersionByImplementation,
  getImplementationDescription,
  getImplementationForVersion
} from "@/utils/stakerVersion"
import { formatAddress } from "@/utils/formatAddress"
import type { ATPData } from "@/hooks/atp"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

interface SetupTokenVaultModalProps {
  isOpen: boolean
  onClose: () => void
  atp: ATPData
  onSetupComplete?: () => void
}

type ModalState = "checklist" | "success"

export const SetupTokenVaultModal = ({
  isOpen,
  onClose,
  atp,
  onSetupComplete
}: SetupTokenVaultModalProps) => {
  const [modalState, setModalState] = useState<ModalState>("checklist")
  const [countdown, setCountdown] = useState(3)

  const { address: connectedAddress } = useAccount()
  const { addTransaction, checkTransactionInQueue, transactions, openCart } = useTransactionCart()

  // Get current implementation from staker contract
  const {
    implementation: currentImplementation,
    isLoading: isLoadingImplementation
  } = useStakerImplementation(atp.staker as Address)

  // Get current operator
  const {
    operator: currentOperator,
    isLoading: isLoadingOperator
  } = useStakerOperator(atp.staker as Address)

  // Get available versions from registry
  const { stakerVersions } = useAtpRegistryData({
    registryAddress: atp.registry
  })
  const { implementations, isLoading: isLoadingImplementations } = useStakerImplementations(stakerVersions, atp.registry)

  // Hooks for transactions
  const upgradeStakerHook = useUpgradeStaker(atp.atpAddress as Address)
  const updateOperatorHook = useUpdateStakerOperator(atp.atpAddress as Address)

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

  // Check what needs to be done
  const needsStakerUpgrade = currentVersion === null || currentVersion === 0n
  const needsOperatorUpdate = currentOperator?.toLowerCase() === ZERO_ADDRESS.toLowerCase()

  // Check if transactions are in queue
  const upgradeTransaction = latestVersion ? upgradeStakerHook.buildRawTx(latestVersion) : null
  const operatorTransaction = connectedAddress ? updateOperatorHook.buildRawTx(connectedAddress) : null

  const isUpgradeInQueue = upgradeTransaction ? checkTransactionInQueue(upgradeTransaction) : false
  const isOperatorInQueue = operatorTransaction ? checkTransactionInQueue(operatorTransaction) : false

  // Check if transactions are completed
  const setupTransactions = useMemo(() => {
    return transactions.filter(tx =>
      tx.metadata?.stepGroupIdentifier === atp.atpAddress &&
      [ATPStakingStepsWithTransaction.OperatorUpdate, ATPStakingStepsWithTransaction.StakerUpgrade].includes(tx.metadata?.stepType as ATPStakingStepsWithTransaction)
    )
  }, [transactions, atp.atpAddress])

  const areTransactionsComplete = useMemo(() => {
    if (setupTransactions.length === 0) return false
    const neededCount = (needsStakerUpgrade ? 1 : 0) + (needsOperatorUpdate ? 1 : 0)
    const completedTxs = setupTransactions.filter(tx => tx.status === "completed")
    return completedTxs.length >= neededCount
  }, [setupTransactions, needsStakerUpgrade, needsOperatorUpdate])

  // Handle success state and countdown
  useEffect(() => {
    if (areTransactionsComplete && modalState !== "success") {
      setModalState("success")
      setCountdown(3)
    }
  }, [areTransactionsComplete, modalState])

  useEffect(() => {
    if (modalState === "success") {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            onSetupComplete?.()
            onClose()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [modalState, onSetupComplete, onClose])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModalState("checklist")
      setCountdown(3)
    }
  }, [isOpen])

  const handleAddToBatch = () => {
    // Add operator update first (if needed)
    if (needsOperatorUpdate && connectedAddress && !isOperatorInQueue) {
      addTransaction({
        type: "delegation",
        label: "Set Operator",
        description: `Set operator to ${formatAddress(connectedAddress)}`,
        transaction: updateOperatorHook.buildRawTx(connectedAddress),
        metadata: {
          atpAddress: atp.atpAddress,
          stepType: ATPStakingStepsWithTransaction.OperatorUpdate,
          stepGroupIdentifier: atp.atpAddress
        }
      }, { preventDuplicate: true })
    }

    // Add staker upgrade (if needed, with dependency on operator if both needed)
    if (needsStakerUpgrade && latestVersion && !isUpgradeInQueue) {
      addTransaction({
        type: "delegation",
        label: "Set Staker Version",
        description: `Upgrade to v${latestVersion.toString()}`,
        transaction: upgradeStakerHook.buildRawTx(latestVersion),
        metadata: {
          atpAddress: atp.atpAddress,
          stepType: ATPStakingStepsWithTransaction.StakerUpgrade,
          stepGroupIdentifier: atp.atpAddress,
          dependsOn: needsOperatorUpdate
            ? buildConditionalDependencies(atp.atpAddress, [
                { condition: true, stepType: ATPStakingStepsWithTransaction.OperatorUpdate }
              ])
            : []
        }
      }, { preventDuplicate: true })
    }

    // Open cart to show transactions
    openCart()
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  const isLoading = isLoadingImplementation || isLoadingImplementations || isLoadingOperator
  const allInQueue = (!needsStakerUpgrade || isUpgradeInQueue) && (!needsOperatorUpdate || isOperatorInQueue)
  const hasAnyPending = needsStakerUpgrade || needsOperatorUpdate

  // Success state
  if (modalState === "success") {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div
          className="modal-content-base max-w-lg w-[90%]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-chartreuse bg-chartreuse/10 rounded-full">
              <Icon name="check" className="w-8 h-8 text-chartreuse" />
            </div>
            <h2 className="font-md-thermochrome text-2xl font-medium text-chartreuse mb-2">
              Setup Complete!
            </h2>
            <p className="text-sm text-parchment/70 mb-4">
              Your Token Vault is now ready for staking and withdrawal.
            </p>
            <p className="text-xs text-parchment/50">
              Closing in {countdown}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content-base max-w-lg w-[90%]"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose}>
          x
        </button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="font-md-thermochrome text-2xl font-medium text-chartreuse mb-2">
              Setup Token Vault
            </h2>
            <p className="text-sm text-parchment/70">
              Complete these steps to enable staking and withdrawal features.
            </p>
          </div>

          {/* ATP Info */}
          <div className="bg-parchment/5 border border-parchment/20 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                Token Vault
              </span>
              <span className="font-mono text-sm text-parchment">
                #{atp.sequentialNumber || "?"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                Allocation
              </span>
              <span className="font-mono text-sm text-parchment">
                {atp.allocation ? Number(formatEther(atp.allocation)).toLocaleString() : "0"} AZTEC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                Type
              </span>
              <span className="font-mono text-sm text-parchment">
                {atp.typeString || "Unknown"}
              </span>
            </div>
          </div>

          {/* Setup Checklist */}
          {isLoading ? (
            <div className="text-sm text-parchment/50 text-center py-4">
              Loading setup status...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard mb-2">
                Setup Checklist
              </div>

              {/* Step 1: Staker Version */}
              <div className={`border p-4 ${
                !needsStakerUpgrade
                  ? "bg-chartreuse/5 border-chartreuse/30"
                  : isUpgradeInQueue
                  ? "bg-aqua/5 border-aqua/30"
                  : "bg-parchment/5 border-parchment/20"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center border ${
                    !needsStakerUpgrade
                      ? "border-chartreuse bg-chartreuse"
                      : isUpgradeInQueue
                      ? "border-aqua bg-aqua"
                      : "border-parchment/40"
                  }`}>
                    {(!needsStakerUpgrade || isUpgradeInQueue) && (
                      <Icon name="check" className={`w-3 h-3 ${!needsStakerUpgrade ? "text-ink" : "text-ink"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-oracle-standard font-bold text-sm text-parchment">
                        Set Staker Version
                      </span>
                      <TooltipIcon
                        content="Upgrade your staker contract to enable staking features"
                        size="sm"
                      />
                    </div>
                    {!needsStakerUpgrade ? (
                      <p className="text-xs text-chartreuse">
                        Already on v{currentVersion?.toString()} ({latestDescription})
                      </p>
                    ) : (
                      <p className="text-xs text-parchment/60">
                        v0 (Disabled) → v{latestVersion?.toString()} (Latest)
                      </p>
                    )}
                    {needsStakerUpgrade && (
                      <div className={`inline-block mt-2 px-2 py-1 text-xs font-oracle-standard ${
                        isUpgradeInQueue
                          ? "bg-aqua/20 text-aqua"
                          : "bg-parchment/10 text-parchment/60"
                      }`}>
                        {isUpgradeInQueue ? "In Batch" : "Pending"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Operator */}
              <div className={`border p-4 ${
                !needsOperatorUpdate
                  ? "bg-chartreuse/5 border-chartreuse/30"
                  : isOperatorInQueue
                  ? "bg-aqua/5 border-aqua/30"
                  : "bg-parchment/5 border-parchment/20"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center border ${
                    !needsOperatorUpdate
                      ? "border-chartreuse bg-chartreuse"
                      : isOperatorInQueue
                      ? "border-aqua bg-aqua"
                      : "border-parchment/40"
                  }`}>
                    {(!needsOperatorUpdate || isOperatorInQueue) && (
                      <Icon name="check" className={`w-3 h-3 ${!needsOperatorUpdate ? "text-ink" : "text-ink"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-oracle-standard font-bold text-sm text-parchment">
                        Set Operator
                      </span>
                      <TooltipIcon
                        content="Set the operator address to control staking operations"
                        size="sm"
                      />
                    </div>
                    {!needsOperatorUpdate ? (
                      <p className="text-xs text-chartreuse">
                        Operator set to {formatAddress(currentOperator as Address)}
                      </p>
                    ) : (
                      <p className="text-xs text-parchment/60">
                        Set to: {connectedAddress ? formatAddress(connectedAddress) : "Connect wallet"} (You)
                      </p>
                    )}
                    {needsOperatorUpdate && (
                      <div className={`inline-block mt-2 px-2 py-1 text-xs font-oracle-standard ${
                        isOperatorInQueue
                          ? "bg-aqua/20 text-aqua"
                          : "bg-parchment/10 text-parchment/60"
                      }`}>
                        {isOperatorInQueue ? "In Batch" : "Pending"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isLoading && hasAnyPending && (
            <button
              onClick={handleAddToBatch}
              disabled={allInQueue || !connectedAddress}
              className="w-full bg-chartreuse text-ink py-3 px-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allInQueue ? "All Steps in Batch" : "Add All to Batch"}
            </button>
          )}

          {/* Already Complete Message */}
          {!isLoading && !hasAnyPending && (
            <div className="bg-chartreuse/10 border border-chartreuse/40 p-4 text-center">
              <span className="text-chartreuse font-oracle-standard font-bold text-sm">
                Setup already complete
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupTokenVaultModal
