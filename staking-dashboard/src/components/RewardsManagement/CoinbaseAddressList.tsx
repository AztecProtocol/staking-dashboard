import { useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { useClaimCoinbaseRewards, useRemoveCoinbaseAddress } from "@/hooks/rewards"
import { useIsRewardsClaimableAcrossRollups } from "@/hooks/rollup"
import type { CoinbaseBreakdown } from "@/hooks/rewards"
import type { Address } from "viem"

interface CoinbaseAddressListProps {
  /**
   * Reward breakdown produced by `useCoinbaseRewardsAcrossRollups` (or its compatibility
   * wrapper `useMultipleCoinbaseRewards`). May contain multiple entries for the same
   * coinbase address — one per rollup that holds a non-zero balance.
   */
  coinbaseBreakdown: CoinbaseBreakdown[]
  decimals: number
  symbol: string
  /**
   * Configured-rollup claimability flag, kept for backwards compatibility. Used as a fallback
   * for rows whose specific rollup hasn't loaded yet. The component itself fetches per-rollup
   * `isRewardsClaimable()` for every distinct rollup it sees in the breakdown so each row's
   * button reflects its own rollup's state.
   */
  isRewardsClaimable: boolean
  isLoading?: boolean
  onRefetch?: () => void
}

export const CoinbaseAddressList = ({
  coinbaseBreakdown,
  decimals,
  symbol,
  isRewardsClaimable,
  isLoading,
  onRefetch
}: CoinbaseAddressListProps) => {
  const { removeCoinbaseAddress, isPending: isRemoving } = useRemoveCoinbaseAddress()
  const claimRewards = useClaimCoinbaseRewards()
  const [claimingRowKey, setClaimingRowKey] = useState<string | null>(null)
  const isClaiming = claimRewards.isPending || claimRewards.isConfirming

  const rollupAddressesInBreakdown = useMemo(
    () => coinbaseBreakdown.map((item) => item.rollupAddress),
    [coinbaseBreakdown],
  )
  const { isClaimable: isClaimableForRollup } = useIsRewardsClaimableAcrossRollups(rollupAddressesInBreakdown)

  const handleRemove = async (address: Address) => {
    await removeCoinbaseAddress(address)
    onRefetch?.()
  }

  const handleClaim = (address: Address, rollupAddress: Address) => {
    setClaimingRowKey(`${address}-${rollupAddress}`)
    claimRewards.claimRewards(address, rollupAddress)
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
        const perRollupClaimable = isClaimableForRollup(item.rollupAddress)
        const rowIsClaimable = perRollupClaimable ?? isRewardsClaimable

        return (
        <div
          key={`${item.address}-${item.rollupAddress}`}
          className="bg-parchment/5 border border-parchment/20 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Address */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-parchment truncate">
                  {item.address.slice(0, 10)}...{item.address.slice(-8)}
                </span>
                <CopyButton text={item.address} size="sm" />
                {item.rollupVersion !== undefined && (
                  <span
                    className="font-oracle-standard text-[10px] uppercase tracking-wide bg-aqua/15 border border-aqua/30 text-aqua px-2 py-0.5"
                    title={`Rollup contract: ${item.rollupAddress}`}
                  >
                    Rollup v{item.rollupVersion.toString()}
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
          {item.rewards > 0n && (() => {
            const rowKey = `${item.address}-${item.rollupAddress}`
            const isThisRowClaiming = claimingRowKey === rowKey && isClaiming
            return (
            <div className="mt-3 pt-3 border-t border-parchment/10">
              {rowIsClaimable ? (
                <button
                  onClick={() => handleClaim(item.address, item.rollupAddress)}
                  disabled={isClaiming}
                  className="w-full py-2 bg-chartreuse text-ink font-bold text-sm uppercase tracking-wide hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isThisRowClaiming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="loader" size="sm" className="animate-spin" />
                      {claimRewards.isPending ? "Confirming..." : "Processing..."}
                    </span>
                  ) : (
                    "Claim Rewards"
                  )}
                </button>
              ) : (
                <div className="text-center py-2 text-parchment/60 text-sm">
                  Rewards are currently locked
                </div>
              )}
            </div>
            )
          })()}
        </div>
        )
      })}
    </div>
  )
}
