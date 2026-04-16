import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { debounce } from "@/utils/debounce"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useClaimSequencerRewards } from "@/hooks/rollup/useClaimSequencerRewards"
import { useIsRewardsClaimableAcrossRollups } from "@/hooks/rollup/useIsRewardsClaimableAcrossRollups"
import { useCoinbaseRewardsAcrossRollups } from "@/hooks/rewards/useCoinbaseRewardsAcrossRollups"
import { useAlert } from "@/contexts/AlertContext"
import type { ATPData } from "@/hooks/atp"
import type { Address } from "viem"

export interface SelfStakeModalData {
  atpAddress: Address
  attesterAddress: Address
  stakedAmount: bigint
}

interface ClaimSelfStakeRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  stake: SelfStakeModalData
  atp: ATPData | undefined
  onSuccess?: () => void
}

/**
 * Modal for claiming self-stake rewards
 * User inputs coinbase address to check and claim rewards
 */
export const ClaimSelfStakeRewardsModal = ({
  isOpen,
  onClose,
  stake,
  atp,
  onSuccess
}: ClaimSelfStakeRewardsModalProps) => {
  const { symbol, decimals } = useStakingAssetTokenDetails()
  const { showAlert } = useAlert()
  const [coinbaseAddress, setCoinbaseAddress] = useState("")
  const [hasCheckedRewards, setHasCheckedRewards] = useState(false)
  const [isDebouncing, setIsDebouncing] = useState(false)

  const isValidAddress = coinbaseAddress.length === 42 && coinbaseAddress.startsWith('0x')
  // Empty array while typing prevents firing reads against an invalid coinbase.
  const coinbasesForQuery = useMemo<Address[]>(
    () => (isValidAddress ? [coinbaseAddress as Address] : []),
    [coinbaseAddress, isValidAddress],
  )

  // Fan the read out across every rollup discovered via the Aztec governance Registry, so a
  // sequencer with stranded balances on older rollups sees them all listed (one row per rollup).
  const {
    coinbaseBreakdown,
    totalCoinbaseRewards,
    isLoading: isLoadingRewards,
    refetch: checkRewards,
  } = useCoinbaseRewardsAcrossRollups(coinbasesForQuery)

  // Multicall isRewardsClaimable() across the same rollups so the per-row claim button reflects
  // the right rollup's gating, not the configured rollup's.
  const rollupAddressesInBreakdown = useMemo(
    () => coinbaseBreakdown.map((row) => row.rollupAddress),
    [coinbaseBreakdown],
  )
  const { isClaimable: isClaimableForRollup } = useIsRewardsClaimableAcrossRollups(rollupAddressesInBreakdown)

  const {
    claimRewards,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset
  } = useClaimSequencerRewards()

  // Create debounced check function that manages debouncing state
  const debouncedCheckRewards = useMemo(
    () => debounce(() => {
      setIsDebouncing(false)
      checkRewards()
      setHasCheckedRewards(true)
    }, 500),
    [checkRewards]
  )

  // Auto-check rewards when valid address is entered (debounced)
  useEffect(() => {
    if (coinbaseAddress.length === 42 && coinbaseAddress.startsWith('0x')) {
      setIsDebouncing(true)
      debouncedCheckRewards()
    } else {
      setHasCheckedRewards(false)
      setIsDebouncing(false)
    }
  }, [coinbaseAddress, debouncedCheckRewards])

  // Per-rollup claim helper — passes the rollup the row's balance lives on so the
  // `claimSequencerRewards` tx is sent to the correct contract.
  const handleClaim = (rollupAddress: Address) => {
    claimRewards(coinbaseAddress as Address, rollupAddress)
  }

  // Handle success — reset the claim hook so the user can claim remaining rollups
  // without closing the modal. The rewards breakdown refetches automatically.
  useEffect(() => {
    if (isSuccess) {
      onSuccess?.()
      reset()
      // Re-trigger the rewards check so the breakdown refreshes
      // and the claimed row disappears while remaining rows stay visible.
      if (coinbaseAddress) {
        debouncedCheckRewards()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- coinbaseAddress is read but not a reactive trigger
  }, [isSuccess, onSuccess, reset, debouncedCheckRewards])

  // Handle errors
  useEffect(() => {
    if (error) {
      const errorMessage = error.message
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showAlert('warning', 'Transaction was cancelled')
      }
    }
  }, [error, showAlert])

  const handleClose = () => {
    onClose()
    setCoinbaseAddress("")
    setHasCheckedRewards(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 backdrop-blur-xs z-[200] flex items-center justify-center p-4 pt-20"
      onClick={handleBackdropClick}
    >
      <div className="bg-ink border-2 border-chartreuse/40 w-full max-w-lg relative max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-parchment/60 hover:text-parchment transition-colors"
        >
          <Icon name="x" size="md" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 mt-1">
              <Icon name="gift" size="lg" className="text-chartreuse w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-arizona-serif text-2xl font-medium text-parchment mb-2">
                Claim Self-Stake Rewards
              </h2>
              <p className="text-parchment/80 text-sm leading-relaxed">
                Enter your coinbase address to check and claim accumulated rewards for this self-stake position.
              </p>
            </div>
          </div>

          {/* Stake Details */}
          <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Token Vault</div>
                <div className="text-parchment font-medium">
                  #{atp?.sequentialNumber || '?'}
                </div>
              </div>
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Sequencer Address</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-parchment">
                    {stake.attesterAddress.slice(0, 10)}...{stake.attesterAddress.slice(-8)}
                  </span>
                  <CopyButton text={stake.attesterAddress} size="sm" />
                </div>
              </div>
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Staked Amount</div>
                <div className="font-mono text-parchment font-bold">
                  {decimals && symbol ? formatTokenAmount(stake.stakedAmount, decimals, symbol) : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Coinbase Address Input */}
          <div className="mb-6">
            <label className="block text-xs text-parchment/60 uppercase tracking-wide mb-2">
              Coinbase Address
            </label>
            <input
              type="text"
              value={coinbaseAddress}
              onChange={(e) => setCoinbaseAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-ink border border-parchment/20 text-parchment px-3 py-2 font-mono text-sm focus:outline-none focus:border-chartreuse/40"
            />
            {!isValidAddress && coinbaseAddress.length > 0 && (
              <p className="text-xs text-vermillion mt-2">
                Invalid address format
              </p>
            )}
            {(isDebouncing || isLoadingRewards) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-parchment/60">
                <div className="w-3 h-3 border border-parchment/30 border-t-parchment rounded-full animate-spin"></div>
                <span>{isDebouncing ? 'Waiting...' : 'Checking rewards...'}</span>
              </div>
            )}
          </div>

          {/* Rewards Display — one row per rollup with a non-zero balance for this coinbase. */}
          {hasCheckedRewards && !isLoadingRewards && !isDebouncing && (
            <>
              {coinbaseBreakdown.length > 0 ? (
                <div className="space-y-3 mb-6">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-parchment/60 uppercase tracking-wide">
                      Available Rewards
                    </div>
                    <div className="font-mono text-sm text-parchment/80">
                      Total: <span className="text-chartreuse font-bold">{decimals && symbol ? formatTokenAmount(totalCoinbaseRewards, decimals, symbol) : '-'}</span>
                    </div>
                  </div>
                  {coinbaseBreakdown.map((row) => {
                    const perRollupClaimable = isClaimableForRollup(row.rollupAddress)
                    // Default to allowing the claim while loading; the contract will revert if it's
                    // genuinely locked. Disable explicitly only when we've confirmed false.
                    const rowIsClaimable = perRollupClaimable !== false
                    return (
                      <div
                        key={row.rollupAddress}
                        className="bg-chartreuse/10 border border-chartreuse/30 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          {row.rollupVersion !== undefined ? (
                            <span
                              className="font-oracle-standard text-[10px] uppercase tracking-wide bg-aqua/15 border border-aqua/30 text-aqua px-2 py-0.5"
                              title={`Rollup contract: ${row.rollupAddress}`}
                            >
                              Rollup v{row.rollupVersion.toString()}
                            </span>
                          ) : (
                            <span className="font-oracle-standard text-[10px] uppercase tracking-wide text-parchment/50">
                              Configured rollup
                            </span>
                          )}
                          <div className="font-mono text-lg font-bold text-chartreuse">
                            {decimals && symbol ? formatTokenAmount(row.rewards, decimals, symbol) : '-'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleClaim(row.rollupAddress)}
                          disabled={isPending || isConfirming || !rowIsClaimable}
                          className="w-full py-2 bg-chartreuse text-ink font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPending || isConfirming ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin"></div>
                              {isPending ? 'Confirming' : 'Claiming'}
                            </div>
                          ) : !rowIsClaimable ? (
                            'Locked on this rollup'
                          ) : (
                            'Claim from this rollup'
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
                  <div className="text-xs text-parchment/60 uppercase tracking-wide mb-2">
                    Available Rewards
                  </div>
                  <p className="text-sm text-parchment/80">
                    No rewards found for this coinbase address on any known rollup.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Error Display */}
          {error && !(error.message.includes('User rejected') || error.message.includes('rejected')) && (
            <div className="bg-vermillion/10 border border-vermillion/20 p-4 mb-6">
              <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">Transaction Error</div>
              <div className="text-xs text-parchment/80">
                {error.message || 'An error occurred while claiming rewards'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-parchment/30 text-parchment font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/10 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
