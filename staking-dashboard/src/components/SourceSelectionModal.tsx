import { useState, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { useAccount } from "wagmi"
import { Icon } from "@/components/Icon"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useATP } from "@/hooks/useATP"
import { useMultipleStakeableAmounts, type StakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"
import { formatTokenAmount } from "@/utils/atpFormatters"

// Internal type for modal selection state - includes vault data for display
type SelectedStakingSource = "wallet" | { type: "vault"; atp: StakeableATPData }

export interface SourceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWallet: (stakeCount: number) => void
  onSelectVault: (atp: StakeableATPData, stakeCount: number) => void
  // Configurable text
  headerTitle: string
  headerSubtitle: string
  stakeCountLabel: string
  // Optional constraint (e.g., provider queue length)
  maxStakesOverride?: number
}

/**
 * Shared modal for selecting staking source (wallet or vault) and stake count.
 * Used by both delegation staking and direct staking flows.
 */
export const SourceSelectionModal = ({
  isOpen,
  onClose,
  onSelectWallet,
  onSelectVault,
  headerTitle,
  headerSubtitle,
  stakeCountLabel,
  maxStakesOverride,
}: SourceSelectionModalProps) => {
  const { address } = useAccount()
  const { stakingAssetAddress, decimals, symbol } = useStakingAssetTokenDetails()
  const { balance: walletBalance } = useERC20Balance(stakingAssetAddress, address)
  const { activationThreshold } = useRollupData()
  const { atpData, isLoadingAtpHoldings, isLoadingAtpData } = useATP()
  const { stakeableAtps, isLoading: isLoadingStakeable } = useMultipleStakeableAmounts(atpData)

  const [selectedSource, setSelectedSource] = useState<SelectedStakingSource | null>(null)
  const [stakeCount, setStakeCount] = useState(1)

  const isLoadingOptions = isLoadingAtpHoldings || isLoadingAtpData || isLoadingStakeable

  // Calculate max stakes from wallet balance
  const maxStakesFromWallet = useMemo(() => {
    if (!activationThreshold || walletBalance === undefined || activationThreshold === 0n) return 0
    const maxFromBalance = Number(walletBalance / activationThreshold)
    // Apply optional override constraint (e.g., provider queue length)
    if (maxStakesOverride !== undefined) {
      return Math.min(maxFromBalance, maxStakesOverride)
    }
    return maxFromBalance
  }, [walletBalance, activationThreshold, maxStakesOverride])

  const canStakeFromWallet = maxStakesFromWallet > 0

  // Get max stakes for current selection
  const currentMaxStakes = useMemo(() => {
    if (!selectedSource) return maxStakesFromWallet
    if (selectedSource === "wallet") return maxStakesFromWallet
    if (!activationThreshold || activationThreshold === 0n) return 0
    const maxFromVault = Number(selectedSource.atp.stakeableAmount / activationThreshold)
    // Apply optional override constraint
    if (maxStakesOverride !== undefined) {
      return Math.min(maxFromVault, maxStakesOverride)
    }
    return maxFromVault
  }, [selectedSource, maxStakesFromWallet, activationThreshold, maxStakesOverride])

  // Total tokens for current selection
  const totalTokens = useMemo(() => {
    if (!activationThreshold) return 0n
    return activationThreshold * BigInt(stakeCount)
  }, [activationThreshold, stakeCount])

  const handleSourceSelect = (source: SelectedStakingSource) => {
    setSelectedSource(source)
    setStakeCount(1)
  }

  const handleConfirmSelection = useCallback(() => {
    if (!selectedSource) return

    // Reset state and close modal
    setSelectedSource(null)
    setStakeCount(1)
    onClose()

    if (selectedSource === "wallet") {
      onSelectWallet(stakeCount)
    } else {
      onSelectVault(selectedSource.atp, stakeCount)
    }
  }, [selectedSource, stakeCount, onClose, onSelectWallet, onSelectVault])

  const handleClose = () => {
    // Reset state on close
    setSelectedSource(null)
    setStakeCount(1)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  const renderSourceSelection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-arizona-serif text-xl font-medium text-parchment mb-2">
          {headerTitle}
        </h3>
        <p className="text-sm text-parchment/70">
          {headerSubtitle}
        </p>
      </div>

      {isLoadingOptions ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-parchment/5 border border-parchment/20 p-4 animate-pulse">
              <div className="h-5 bg-parchment/20 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-parchment/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Source Options */}
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {/* Wallet Option */}
            <button
              onClick={() => canStakeFromWallet && handleSourceSelect("wallet")}
              disabled={!canStakeFromWallet}
              className={`w-full text-left p-4 border transition-all ${
                selectedSource === "wallet"
                  ? "bg-chartreuse/10 border-chartreuse"
                  : canStakeFromWallet
                    ? "bg-parchment/5 border-parchment/30 hover:border-chartreuse/50"
                    : "bg-parchment/5 border-parchment/10 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  selectedSource === "wallet"
                    ? "bg-chartreuse/30 text-chartreuse"
                    : canStakeFromWallet
                      ? "bg-chartreuse/20 text-chartreuse"
                      : "bg-parchment/20 text-parchment/40"
                }`}>
                  <Icon name="wallet" className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-oracle-standard font-bold text-sm uppercase tracking-wide text-parchment">
                      Wallet
                    </span>
                    {canStakeFromWallet && (
                      <span className="text-xs font-mono text-chartreuse">
                        Up to {maxStakesFromWallet} stake{maxStakesFromWallet !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-parchment/60">
                    {decimals !== undefined && symbol
                      ? formatTokenAmount(walletBalance || 0n, decimals, symbol)
                      : "Loading..."}
                  </div>
                </div>
                {selectedSource === "wallet" && (
                  <Icon name="check" className="w-5 h-5 text-chartreuse" />
                )}
              </div>
            </button>

            {/* Token Vault Options */}
            {stakeableAtps.map((atp, index) => {
              const maxFromVault = activationThreshold && activationThreshold > 0n
                ? Number(atp.stakeableAmount / activationThreshold)
                : 0
              const maxStakesFromVault = maxStakesOverride !== undefined
                ? Math.min(maxFromVault, maxStakesOverride)
                : maxFromVault
              const isSelected = selectedSource !== "wallet" && selectedSource?.type === "vault" && selectedSource.atp.atpAddress === atp.atpAddress

              return (
                <button
                  key={atp.atpAddress}
                  onClick={() => handleSourceSelect({ type: "vault", atp })}
                  className={`w-full text-left p-4 border transition-all ${
                    isSelected
                      ? "bg-aqua/10 border-aqua"
                      : "bg-parchment/5 border-parchment/30 hover:border-aqua/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                      isSelected ? "bg-aqua/30 text-aqua" : "bg-aqua/20 text-aqua"
                    }`}>
                      <Icon name="archive" className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-oracle-standard font-bold text-sm uppercase tracking-wide text-parchment">
                          Token Vault #{index + 1}
                        </span>
                        <span className="text-xs font-mono text-aqua">
                          Up to {maxStakesFromVault} stake{maxStakesFromVault !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-parchment/60">
                        {decimals !== undefined && symbol
                          ? formatTokenAmount(atp.stakeableAmount, decimals, symbol)
                          : "Loading..."}
                      </div>
                    </div>
                    {isSelected && (
                      <Icon name="check" className="w-5 h-5 text-aqua" />
                    )}
                  </div>
                </button>
              )
            })}

            {/* No options available */}
            {!canStakeFromWallet && stakeableAtps.length === 0 && (
              <div className="bg-parchment/5 border border-parchment/20 p-6 text-center">
                <p className="text-parchment/70 text-sm">
                  No staking options available. You need either wallet balance or a Token Vault with sufficient funds.
                </p>
              </div>
            )}
          </div>

          {/* Stake Count (shown when any source is selected) */}
          {selectedSource && (
            <div className="border-t border-parchment/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-oracle-standard uppercase tracking-wide text-parchment/70">
                  {stakeCountLabel}
                </span>
                <div className="text-xs font-mono text-parchment/60">
                  Total: <span className={selectedSource === "wallet" ? "text-chartreuse" : "text-aqua"}>
                    {decimals !== undefined && symbol
                      ? formatTokenAmount(totalTokens, decimals, symbol)
                      : "..."}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setStakeCount(Math.max(1, stakeCount - 1))}
                  disabled={stakeCount <= 1}
                  className="w-10 h-10 bg-parchment/10 border border-parchment/30 flex items-center justify-center hover:bg-parchment/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xl font-bold text-parchment"
                >
                  −
                </button>

                <div className="text-center min-w-[80px]">
                  <div className={`text-3xl font-mono font-bold ${selectedSource === "wallet" ? "text-chartreuse" : "text-aqua"}`}>
                    {stakeCount}
                  </div>
                </div>

                <button
                  onClick={() => setStakeCount(Math.min(currentMaxStakes, stakeCount + 1))}
                  disabled={stakeCount >= currentMaxStakes}
                  className="w-10 h-10 bg-parchment/10 border border-parchment/30 flex items-center justify-center hover:bg-parchment/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="plus" className="w-5 h-5 text-parchment" />
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => setStakeCount(1)}
                  disabled={stakeCount === 1}
                  className="px-3 py-1 text-xs font-oracle-standard uppercase tracking-wide text-parchment/60 hover:text-parchment disabled:opacity-30"
                >
                  Min
                </button>
                <button
                  onClick={() => setStakeCount(currentMaxStakes)}
                  disabled={stakeCount === currentMaxStakes}
                  className={`px-3 py-1 text-xs font-oracle-standard uppercase tracking-wide ${selectedSource === "wallet" ? "text-chartreuse hover:text-chartreuse/80" : "text-aqua hover:text-aqua/80"} disabled:opacity-30`}
                >
                  Max ({currentMaxStakes})
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Continue Button */}
      {selectedSource && (
        <button
          onClick={handleConfirmSelection}
          className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment transition-all"
        >
          Continue
        </button>
      )}
    </div>
  )

  return createPortal(
    <div
      className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-malachite border-2 border-chartreuse max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="shrink-0 bg-malachite border-b border-parchment/10 p-4 flex justify-between items-center">
          <div className="text-xs font-oracle-standard uppercase tracking-wide text-parchment/60">
            Select Staking Source
          </div>
          <button
            onClick={handleClose}
            className="text-parchment/60 hover:text-parchment transition-colors p-1"
            aria-label="Close modal"
          >
            <Icon name="x" size="lg" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderSourceSelection()}
        </div>
      </div>
    </div>,
    document.body
  )
}
