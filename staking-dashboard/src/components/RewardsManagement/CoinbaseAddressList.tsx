import { useMemo } from "react"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { useRemoveCoinbaseAddress } from "@/hooks/rewards"
import { useIsRewardsClaimableAcrossRollups } from "@/hooks/rollup"
import { buildClaimSequencerRewardsTx } from "@/utils/claimCart"
import { useTransactionCart, ClaimStepType } from "@/contexts/TransactionCartContext"
import type { CoinbaseBreakdown } from "@/hooks/rewards"
import type { Address } from "viem"

interface CoinbaseAddressListProps {
  /**
   * Reward breakdown produced by `useCoinbaseRewardsAcrossRollups` (or its wrapper
   * `useMultipleCoinbaseRewards`). May contain multiple entries for the same coinbase —
   * one row per rollup the coinbase has a balance on. Pass `allCoinbaseBreakdown` to
   * keep saved-but-zero-balance rows visible and removable.
   */
  coinbaseBreakdown: CoinbaseBreakdown[]
  decimals: number
  symbol: string
  /**
   * Configured-rollup claimability flag, used as a fallback when the per-rollup value
   * hasn't loaded yet. Each row otherwise gates on its own rollup's `isRewardsClaimable()`.
   */
  isRewardsClaimable: boolean
  isLoading?: boolean
  onRefetch?: () => void
}

/**
 * Display list of coinbase rewards with one row per (coinbase, rollup) pair.
 * Each claim button adds the corresponding `claimSequencerRewards` tx to the
 * transaction cart; execution happens from the cart panel.
 */
export const CoinbaseAddressList = ({
  coinbaseBreakdown,
  decimals,
  symbol,
  isLoading,
  onRefetch
}: CoinbaseAddressListProps) => {
  const { removeCoinbaseAddress, isPending: isRemoving } = useRemoveCoinbaseAddress()
  const { addTransaction, checkTransactionInQueue, openCart } = useTransactionCart()

  const rollupAddressesInBreakdown = useMemo(
    () => coinbaseBreakdown.map((item) => item.rollupAddress),
    [coinbaseBreakdown],
  )
  const { isClaimable: isClaimableForRollup } = useIsRewardsClaimableAcrossRollups(rollupAddressesInBreakdown)

  const handleRemove = async (address: Address) => {
    await removeCoinbaseAddress(address)
    onRefetch?.()
  }

  const handleAddToBatch = (
    address: Address,
    rollupAddress: Address,
    rollupVersion: string | undefined,
    rewards: bigint,
  ) => {
    const tx = buildClaimSequencerRewardsTx(address, rollupAddress)
    addTransaction(
      {
        type: "claim",
        label: `Claim rewards — Rollup v${rollupVersion ?? "?"}`,
        description: `${formatTokenAmountFull(rewards, decimals, symbol)} from ${address.slice(0, 10)}…${address.slice(-8)}`,
        transaction: tx,
        metadata: {
          stepType: ClaimStepType.CoinbaseClaim,
          stepGroupIdentifier: `coinbase:${address.toLowerCase()}:${rollupAddress.toLowerCase()}`,
          coinbase: address,
          rollupAddress,
          rollupVersion,
          amount: rewards,
        },
      },
      { preventDuplicate: true },
    )
    openCart()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="loader" size="md" className="animate-spin text-parchment/60" />
      </div>
    )
  }

  if (coinbaseBreakdown.length === 0) {
    return (
      <div className="py-8 text-center">
        <Icon name="inbox" size="lg" className="text-parchment/30 mx-auto mb-2" />
        <p className="text-parchment/60 text-sm">No coinbase addresses added yet</p>
        <p className="text-parchment/40 text-xs mt-1">
          Add your sequencer's coinbase address to track rewards
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {coinbaseBreakdown.map((item) => {
        // Lock a row only when its rollup explicitly reports rewards as not
        // claimable (`isRewardsClaimable() === false`, the network-wide freeze on
        // older rollups). A revert — e.g. the V5 rollup, which removed the
        // function — or a still-loading read is treated as claimable, since
        // claims on those rollups are live. See issue #111.
        const rowIsClaimable = isClaimableForRollup(item.rollupAddress)
        const rowKey = `${item.address}-${item.rollupAddress}`
        const tx = buildClaimSequencerRewardsTx(item.address, item.rollupAddress)
        const isInBatch = checkTransactionInQueue(tx)

        return (
          <div
            key={rowKey}
            className="bg-parchment/5 border border-parchment/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Address + version badge */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-sm text-parchment truncate">
                    {item.address.slice(0, 10)}...{item.address.slice(-8)}
                  </span>
                  <CopyButton text={item.address} size="sm" />
                  {item.rollupVersion !== undefined && (
                    <span
                      className="font-oracle-standard text-[10px] uppercase tracking-wide bg-aqua/15 border border-aqua/30 text-aqua px-2 py-0.5"
                      title={`Rollup contract: ${item.rollupAddress}`}
                    >
                      Rollup v{item.rollupVersion}
                    </span>
                  )}
                </div>

                {/* Rewards */}
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">
                  Accumulated Rewards
                </div>
                <div className="font-mono text-lg font-bold text-chartreuse">
                  {formatTokenAmountFull(item.rewards, decimals, symbol)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleRemove(item.address)}
                  disabled={isRemoving}
                  className="p-2 text-parchment/60 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Remove address"
                >
                  <Icon name="trash2" size="sm" />
                </button>
              </div>
            </div>

            {/* Claim Button */}
            {item.rewards > 0n && (
              <div className="mt-3 pt-3 border-t border-parchment/10">
                {rowIsClaimable ? (
                  isInBatch ? (
                    <button
                      onClick={openCart}
                      className="w-full py-2 bg-chartreuse/20 border border-chartreuse/40 text-chartreuse font-bold text-sm uppercase tracking-wide hover:bg-chartreuse/30 transition-colors"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="shoppingCart" size="sm" />
                        Already in batch — review &amp; execute
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToBatch(item.address, item.rollupAddress, item.rollupVersion, item.rewards)}
                      className="w-full py-2 bg-chartreuse text-ink font-bold text-sm uppercase tracking-wide hover:bg-chartreuse/90 transition-colors"
                    >
                      Add to batch
                    </button>
                  )
                ) : (
                  <div className="text-center py-2 text-parchment/60 text-sm">
                    Rewards are currently locked
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
