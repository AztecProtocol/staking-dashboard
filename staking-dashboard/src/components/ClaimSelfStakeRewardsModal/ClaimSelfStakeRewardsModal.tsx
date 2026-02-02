import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { debounce } from "@/utils/debounce"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useClaimSequencerRewards } from "@/hooks/rollup/useClaimSequencerRewards"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
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

  const {
    rewards,
    isLoading: isLoadingRewards,
    refetch: checkRewards
  } = useSequencerRewards(coinbaseAddress)

  const {
    claimRewards,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset
  } = useClaimSequencerRewards()

  const { isRewardsClaimable } = useIsRewardsClaimable()

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

  const handleClaim = () => {
    claimRewards(coinbaseAddress as Address)
  }

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      onSuccess?.()
      onClose()
      setCoinbaseAddress("")
      setHasCheckedRewards(false)
      reset()
    }
  }, [isSuccess, onSuccess, onClose, reset])

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

  const isValidAddress = coinbaseAddress.length === 42 && coinbaseAddress.startsWith('0x')

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

          {/* Rewards Display */}
          {hasCheckedRewards && !isLoadingRewards && !isDebouncing && (
            <>
              {rewards !== undefined ? (
                <div className="bg-chartreuse/10 border border-chartreuse/30 p-4 mb-6">
                  <div className="text-xs text-parchment/60 uppercase tracking-wide mb-2">
                    Available Rewards
                  </div>
                  <div className="font-mono text-2xl font-bold text-chartreuse">
                    {decimals && symbol ? formatTokenAmount(rewards, decimals, symbol) : '-'}
                  </div>
                  {rewards === 0n && (
                    <p className="text-xs text-parchment/60 mt-2">
                      No rewards available for this coinbase address
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-vermillion/10 border border-vermillion/20 p-4 mb-6">
                  <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">
                    Coinbase Not Found
                  </div>
                  <div className="text-xs text-parchment/80">
                    Cannot find rewards for this coinbase address. Please verify the address is correct.
                  </div>
                </div>
              )}

              {/* Rewards Not Claimable Warning */}
              {isRewardsClaimable === false && (
                <div className="bg-parchment/10 border border-parchment/30 p-4 mb-6">
                  <div className="text-xs font-oracle-standard font-bold text-parchment mb-1 uppercase tracking-wide">
                    Rewards Currently Locked
                  </div>
                  <div className="text-xs text-parchment/80">
                    All rewards are currently locked by the network protocol (rollup). Claiming will be enabled once the protocol unlocks rewards.
                  </div>
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
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={
                !rewards ||
                rewards === 0n ||
                isPending ||
                isConfirming ||
                isRewardsClaimable === false
              }
              className="px-6 py-3 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin"></div>
                  {isPending ? 'Confirming' : 'Claiming'}
                </div>
              ) : (
                'Claim Rewards'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
