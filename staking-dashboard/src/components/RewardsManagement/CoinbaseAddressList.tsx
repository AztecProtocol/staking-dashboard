import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { useClaimCoinbaseRewards, useRemoveCoinbaseAddress } from "@/hooks/rewards"
import type { CoinbaseBreakdown } from "@/hooks/rewards"
import type { Address } from "viem"

interface CoinbaseAddressListProps {
  coinbaseBreakdown: CoinbaseBreakdown[]
  decimals: number
  symbol: string
  isRewardsClaimable: boolean
  isLoading?: boolean
  onRefetch?: () => void
}

/**
 * Display list of coinbase addresses with their rewards
 */
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

  const handleRemove = async (address: Address) => {
    await removeCoinbaseAddress(address)
    onRefetch?.()
  }

  const handleClaim = async (address: Address) => {
    await claimRewards.claimRewards(address)
    onRefetch?.()
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
      {coinbaseBreakdown.map((item) => (
        <div
          key={item.address}
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
              {isRewardsClaimable ? (
                <button
                  onClick={() => handleClaim(item.address)}
                  disabled={claimRewards.isPending || claimRewards.isConfirming}
                  className="w-full py-2 bg-chartreuse text-ink font-bold text-sm uppercase tracking-wide hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {claimRewards.isPending || claimRewards.isConfirming ? (
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
          )}
        </div>
      ))}
    </div>
  )
}
