import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmount, formatTokenAmountFull } from "@/utils/atpFormatters"
import { validateAddress } from "@/utils/validateAddress"
import { RollupRewardRow } from "./RollupRewardRow"
import { debounce } from "@/utils/debounce"
import { useFeeAssetTokenDetails } from "@/hooks/rollup"
import { buildClaimSequencerRewardsTx } from "@/utils/claimCart"
import { useIsRewardsClaimableAcrossRollups } from "@/hooks/rollup/useIsRewardsClaimableAcrossRollups"
import { useCoinbaseRewardsAcrossRollups } from "@/hooks/rewards/useCoinbaseRewardsAcrossRollups"
import { useTransactionCart, ClaimStepType } from "@/contexts/TransactionCartContext"
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
 * Modal for claiming self-stake rewards. Fans out reward reads across every
 * rollup the indexer has seen, so the user sees (and can claim) stranded
 * balances on non-canonical rollups. Each row adds a single
 * `claimSequencerRewards` tx to the transaction cart; the user reviews and
 * executes from the cart panel.
 */
export const ClaimSelfStakeRewardsModal = ({
  isOpen,
  onClose,
  stake,
  atp,
  onSuccess,
}: ClaimSelfStakeRewardsModalProps) => {
  const { symbol, decimals } = useFeeAssetTokenDetails()
  const [coinbaseAddress, setCoinbaseAddress] = useState("")
  const [hasCheckedRewards, setHasCheckedRewards] = useState(false)
  const [isDebouncing, setIsDebouncing] = useState(false)

  const { addTransaction, checkTransactionInQueue, openCart } = useTransactionCart()

  const isValidAddress = validateAddress(coinbaseAddress)
  const coinbasesForQuery = useMemo<Address[]>(
    () => (isValidAddress ? [coinbaseAddress as Address] : []),
    [coinbaseAddress, isValidAddress],
  )

  // Per-rollup reward reads
  const {
    coinbaseBreakdown,
    totalCoinbaseRewards,
    isLoading: isLoadingRewards,
    refetch: checkRewards,
  } = useCoinbaseRewardsAcrossRollups(coinbasesForQuery)

  // Per-rollup claimability check
  const rollupAddressesInBreakdown = useMemo(
    () => coinbaseBreakdown.map((row) => row.rollupAddress),
    [coinbaseBreakdown],
  )
  const { isClaimable: isClaimableForRollup } = useIsRewardsClaimableAcrossRollups(rollupAddressesInBreakdown)

  // Create debounced check function that manages debouncing state
  const debouncedCheckRewards = useMemo(
    () =>
      debounce(() => {
        setIsDebouncing(false)
        checkRewards()
        setHasCheckedRewards(true)
      }, 500),
    [checkRewards],
  )

  // Auto-check rewards when valid address is entered (debounced)
  useEffect(() => {
    if (validateAddress(coinbaseAddress)) {
      setIsDebouncing(true)
      debouncedCheckRewards()
    } else {
      setHasCheckedRewards(false)
      setIsDebouncing(false)
    }
  }, [coinbaseAddress, debouncedCheckRewards])

  const handleAddToBatch = (rollupAddress: Address, rollupVersion: string | undefined, rewards: bigint) => {
    const tx = buildClaimSequencerRewardsTx(coinbaseAddress as Address, rollupAddress)
    addTransaction(
      {
        type: "claim",
        label: `Claim self-stake rewards — Rollup v${rollupVersion ?? "?"}`,
        description: `${formatTokenAmountFull(rewards, decimals ?? 18, symbol ?? "")} from ${coinbaseAddress.slice(0, 10)}…${coinbaseAddress.slice(-8)}`,
        transaction: tx,
        metadata: {
          stepType: ClaimStepType.CoinbaseClaim,
          stepGroupIdentifier: `self-stake:${coinbaseAddress.toLowerCase()}:${rollupAddress.toLowerCase()}`,
          coinbase: coinbaseAddress as Address,
          rollupAddress,
          rollupVersion,
          amount: rewards,
        },
      },
      { preventDuplicate: true },
    )
    onSuccess?.()
    openCart()
  }

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
                Enter your coinbase address to check accumulated rewards. Each rollup row adds a claim transaction to your batch — open the cart to execute.
              </p>
            </div>
          </div>

          {/* Stake Details */}
          <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Token Vault</div>
                <div className="text-parchment font-medium">
                  #{atp?.sequentialNumber || "?"}
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
                  {decimals && symbol ? formatTokenAmount(stake.stakedAmount, decimals, symbol) : "-"}
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
              <p className="text-xs text-vermillion mt-2">Invalid address format</p>
            )}
            {(isDebouncing || isLoadingRewards) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-parchment/60">
                <div className="w-3 h-3 border border-parchment/30 border-t-parchment rounded-full animate-spin"></div>
                <span>{isDebouncing ? "Waiting..." : "Checking rewards..."}</span>
              </div>
            )}
          </div>

          {/* Rewards Display — one row per rollup that holds a non-zero balance. */}
          {hasCheckedRewards && !isLoadingRewards && !isDebouncing && (
            <div className="mb-6">
              {coinbaseBreakdown.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-parchment/60 uppercase tracking-wide">Available Rewards</div>
                    <div className="font-mono text-sm text-parchment/80">
                      Total: <span className="text-chartreuse font-bold">
                        {decimals && symbol ? formatTokenAmount(totalCoinbaseRewards, decimals, symbol) : "-"}
                      </span>
                    </div>
                  </div>
                  {coinbaseBreakdown.map((row) => {
                    const tx = buildClaimSequencerRewardsTx(coinbaseAddress as Address, row.rollupAddress)
                    const isInBatch = checkTransactionInQueue(tx)
                    return (
                      <RollupRewardRow
                        key={row.rollupAddress}
                        rollupAddress={row.rollupAddress}
                        rollupVersion={row.rollupVersion}
                        rewards={row.rewards}
                        decimals={decimals ?? 18}
                        symbol={symbol ?? ""}
                        isClaimable={isClaimableForRollup(row.rollupAddress) === true}
                        isInBatch={isInBatch}
                        onAddToBatch={() => handleAddToBatch(row.rollupAddress, row.rollupVersion, row.rewards)}
                        onOpenCart={openCart}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="bg-parchment/5 border border-parchment/20 p-4">
                  <div className="text-xs text-parchment/60 uppercase tracking-wide mb-2">Available Rewards</div>
                  <p className="text-sm text-parchment/80">
                    No rewards found for this coinbase address on any known rollup.
                  </p>
                </div>
              )}
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
    document.body,
  )
}
