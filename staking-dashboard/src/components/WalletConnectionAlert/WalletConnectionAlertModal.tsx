import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useAccount } from "wagmi"
import { useATP } from "@/hooks/useATP"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { Icon } from "@/components/Icon"
import { useMultipleStakeableAmounts } from "@/hooks/atp"
import { formatTokenAmount } from "@/utils/atpFormatters"

interface WalletConnectionAlertModalProps {
  isSafeWarningShown: boolean
}

/**
 * Alert modal that appears when user connects wallet and has ATPs with balance > ACTIVATION_THRESHOLD
 * Warns users that they must stake and cannot withdraw unless they stake
 * Shows after SafeWarningModal is dismissed
 */
export const WalletConnectionAlertModal = ({ isSafeWarningShown }: WalletConnectionAlertModalProps) => {
  const { isConnected, address } = useAccount()
  const { atpData, isLoadingAtpData } = useATP()
  const { activationThreshold } = useRollupData()
  const { symbol, decimals } = useStakingAssetTokenDetails()
  const [isOpen, setIsOpen] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  // Persist per wallet address in sessionStorage
  const storageKey = address ? `wallet-connection-alert-shown-${address}` : null
  const hasShownAlert = storageKey ? sessionStorage.getItem(storageKey) === 'true' : false

  const { stakeableAtps } = useMultipleStakeableAmounts(atpData)

  const formattedThreshold = activationThreshold && decimals && symbol
    ? formatTokenAmount(activationThreshold, decimals, symbol)
    : 'activation threshold'

  useEffect(() => {
    // Don't show if Safe warning is currently being shown
    if (isSafeWarningShown) {
      return
    }

    // Only check once when wallet connects and data is loaded
    if (!isConnected || isLoadingAtpData || !activationThreshold || hasShownAlert) {
      return
    }

    // Check if any ATP has allocation > activation threshold
    const hasAtpAboveThreshold = stakeableAtps.reduce((a, b) => a + Number(b.stakeableAmount), 0) >= activationThreshold

    if (hasAtpAboveThreshold && storageKey) {
      setIsOpen(true)
      sessionStorage.setItem(storageKey, 'true')
    }
  }, [isConnected, stakeableAtps, activationThreshold, isLoadingAtpData, hasShownAlert, isSafeWarningShown, storageKey])

  // Reset flag when wallet disconnects
  useEffect(() => {
    if (!isConnected && storageKey) {
      sessionStorage.removeItem(storageKey)
    }
  }, [isConnected, storageKey])

  const handleClose = () => {
    setIsOpen(false)
    setIsChecked(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isChecked) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-ink border-2 border-chartreuse/40 w-full max-w-lg relative">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <Icon name="info" size="lg" className="text-chartreuse w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="font-md-thermochrome text-3xl text-parchment">
                  Staking Required
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={!isChecked}
                className="flex-shrink-0 text-parchment/60 hover:text-parchment transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-parchment/60"
              >
                <Icon name="x" size="md" />
              </button>
            </div>
            <p className="text-parchment/80 text-sm leading-relaxed">
              You have one or more Token Vaults with balance exceeding {formattedThreshold}.
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-chartreuse/10 border border-chartreuse/30 p-4 mb-6">
            <div className="space-y-3 text-sm text-parchment/90">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1">
                  <Icon name="info" size="sm" className="text-chartreuse" />
                </div>
                <div>
                  <span className="font-bold text-parchment">Important:</span> You must stake your tokens before you can withdraw them.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1">
                  <Icon name="info" size="sm" className="text-chartreuse" />
                </div>
                <div>
                  Withdrawals are not possible until you stake at least {formattedThreshold}.
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 border-2 transition-all ${
                  isChecked
                    ? 'bg-chartreuse border-chartreuse'
                    : 'border-parchment/40 bg-transparent'
                }`}>
                  {isChecked && (
                    <Icon name="check" size="sm" className="text-ink" />
                  )}
                </div>
              </div>
              <span className="font-oracle-standard text-sm text-parchment/90 leading-relaxed">
                I understand that I must stake my tokens before I can withdraw them
              </span>
            </label>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              disabled={!isChecked}
              className="bg-chartreuse text-ink py-3 px-6 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-chartreuse"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
