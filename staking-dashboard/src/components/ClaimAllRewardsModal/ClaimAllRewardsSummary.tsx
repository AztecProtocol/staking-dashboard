import { Icon } from "@/components/Icon"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import type { DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { CoinbaseBreakdown } from "@/hooks/rewards/rewardsTypes"

interface ClaimAllRewardsSummaryProps {
  delegations: DelegationBreakdown[]
  coinbases: CoinbaseBreakdown[]
  pendingWarehouseWithdrawal?: bigint
  decimals: number
  symbol: string
  isRewardsClaimable: boolean
  onStartClaiming: () => void
  isDisabled: boolean
}

/**
 * Summary view before claiming showing breakdown of all rewards
 */
export const ClaimAllRewardsSummary = ({
  delegations,
  coinbases,
  pendingWarehouseWithdrawal = 0n,
  decimals,
  symbol,
  isRewardsClaimable,
  onStartClaiming,
  isDisabled
}: ClaimAllRewardsSummaryProps) => {
  // Filter to only items with rewards
  const delegationsWithRewards = delegations.filter(d => d.rewards > 0n)
  const coinbasesWithRewards = coinbases.filter(c => c.rewards > 0n)

  // Calculate totals
  const totalDelegationRewards = delegationsWithRewards.reduce((sum, d) => sum + d.rewards, 0n)
  const totalCoinbaseRewards = coinbasesWithRewards.reduce((sum, c) => sum + c.rewards, 0n)
  // Include pending warehouse withdrawal in total
  const totalRewards = totalDelegationRewards + totalCoinbaseRewards + pendingWarehouseWithdrawal

  const hasRewards = totalRewards > 0n

  return (
    <div className="space-y-6">
      {/* Rewards Locked Warning */}
      {!isRewardsClaimable && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <Icon name="warning" size="md" className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-500 font-bold text-sm">Rewards Locked</p>
              <p className="text-parchment/60 text-xs mt-1">
                Rewards are currently locked and cannot be claimed. Check back later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="bg-chartreuse/10 border border-chartreuse/30 p-4">
        <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">
          Total to Claim
        </div>
        <div className="font-mono text-2xl font-bold text-chartreuse">
          {formatTokenAmountFull(totalRewards, decimals, symbol)}
        </div>
      </div>

      {/* Delegation Rewards */}
      {delegationsWithRewards.length > 0 && (
        <div>
          <div className="text-xs text-parchment/40 uppercase tracking-wide mb-3">
            Delegation Rewards ({delegationsWithRewards.length})
          </div>
          <div className="space-y-2">
            {delegationsWithRewards.map((delegation) => {
              const userPercentage = ((10000 - delegation.providerTakeRate) / 100).toFixed(1)
              // Calculate estimated total (reverse the user share calculation)
              const estimatedTotal = delegation.providerTakeRate < 10000
                ? (delegation.rewards * 10000n) / BigInt(10000 - delegation.providerTakeRate)
                : 0n

              return (
                <div
                  key={delegation.splitContract}
                  className="bg-parchment/5 border border-parchment/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-chartreuse/20 text-chartreuse text-xs font-bold uppercase tracking-wide">
                        <Icon name="users" size="sm" />
                        {delegation.providerName || `Provider ${delegation.providerId}`}
                      </span>
                      <span className="text-xs text-parchment/40">
                        {userPercentage}% yours
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-chartreuse">
                        {formatTokenAmountFull(delegation.rewards, decimals, symbol)}
                      </div>
                      {estimatedTotal > delegation.rewards && (
                        <div className="text-xs text-parchment/40">
                          of {formatTokenAmountFull(estimatedTotal, decimals, symbol)} total
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-parchment/40">
                    3 transactions: claim, distribute, withdraw
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Coinbase Rewards */}
      {coinbasesWithRewards.length > 0 && (
        <div>
          <div className="text-xs text-parchment/40 uppercase tracking-wide mb-3">
            Self-Stake Rewards ({coinbasesWithRewards.length})
          </div>
          <div className="space-y-2">
            {coinbasesWithRewards.map((coinbase) => (
              <div
                key={coinbase.address}
                className="bg-parchment/5 border border-parchment/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-parchment/20 text-parchment/80 text-xs font-bold uppercase tracking-wide">
                      <Icon name="wallet" size="sm" />
                      Coinbase
                    </span>
                    <span className="font-mono text-xs text-parchment/60">
                      {coinbase.address.slice(0, 6)}...{coinbase.address.slice(-4)}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-chartreuse">
                    {formatTokenAmountFull(coinbase.rewards, decimals, symbol)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-parchment/40">
                  1 transaction: claim (sent to coinbase)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Warehouse Withdrawal */}
      {pendingWarehouseWithdrawal > 0n && (
        <div>
          <div className="text-xs text-parchment/40 uppercase tracking-wide mb-3">
            Pending Withdrawal
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="wallet" size="sm" className="text-amber-500" />
                <span className="text-sm text-parchment">
                  Ready to withdraw
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-chartreuse">
                {formatTokenAmountFull(pendingWarehouseWithdrawal, decimals, symbol)}
              </div>
            </div>
            <div className="mt-2 text-xs text-parchment/40">
              Already distributed, just needs withdrawal from warehouse
            </div>
          </div>
        </div>
      )}

      {/* No Rewards */}
      {!hasRewards && (
        <div className="py-8 text-center">
          <Icon name="inbox" size="lg" className="text-parchment/30 mx-auto mb-2" />
          <p className="text-parchment/60 text-sm">No rewards available to claim</p>
        </div>
      )}

      {/* Claim Button */}
      <button
        onClick={onStartClaiming}
        disabled={isDisabled || !hasRewards || !isRewardsClaimable}
        className="w-full py-4 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isRewardsClaimable
          ? "Rewards Locked"
          : !hasRewards
            ? "No Rewards to Claim"
            : "Claim All Rewards"}
      </button>

      {/* Transaction Info */}
      {hasRewards && isRewardsClaimable && (
        <p className="text-xs text-parchment/40 text-center">
          This will require multiple transactions. Each claim will prompt for approval.
        </p>
      )}
    </div>
  )
}
