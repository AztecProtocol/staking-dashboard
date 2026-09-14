import { Icon } from "@/components/Icon"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { getRecoveryDustThreshold } from "@/utils/claimCart"
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
  // Anything with on-chain rewards shows in the main list — including
  // manual-payout delegations during the transition window, when their
  // split still holds balance the delegator can sweep themselves. The
  // row in that case gets a "manual payout" badge so the user knows
  // future rewards will come out of protocol. The separate "Manual
  // payouts" section below lists ONLY manual-payout delegations with
  // no remaining on-chain balance — purely informational.
  const delegationsWithRewards = delegations.filter(d => d.rewards > 0n)
  const manualPayoutDelegations = delegations.filter(
    d => d.manualPayoutAuditUrl && d.rewards === 0n,
  )
  const coinbasesWithRewards = coinbases.filter(c => c.rewards > 0n)

  // Every PullSplit keeps 1 wei after a distribute, so a drained warehouse
  // still reports a non-zero balance. Treat anything under the shared dust
  // threshold as nothing to withdraw, otherwise the summary advertises a
  // "ready to withdraw" row that costs gas and moves no tokens.
  const warehouseWithdrawal =
    pendingWarehouseWithdrawal >= getRecoveryDustThreshold(decimals) ? pendingWarehouseWithdrawal : 0n

  // Calculate totals
  const totalDelegationRewards = delegationsWithRewards.reduce((sum, d) => sum + d.rewards, 0n)
  const totalCoinbaseRewards = coinbasesWithRewards.reduce((sum, c) => sum + c.rewards, 0n)
  // Include pending warehouse withdrawal in total
  const totalRewards = totalDelegationRewards + totalCoinbaseRewards + warehouseWithdrawal

  const hasRewards = totalRewards > 0n

  return (
    <div className="space-y-6">
      {/* Configured-rollup locked banner — informational only. Per-task rollups handle
          their own gating, so claims on other rollups may still succeed; failed tasks
          surface via the engine's retry flow. */}
      {!isRewardsClaimable && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <Icon name="warning" size="md" className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-500 font-bold text-sm">Configured Rollup Locked</p>
              <p className="text-parchment/60 text-xs mt-1">
                Rewards on the configured rollup are currently locked. Claims targeting
                other rollup versions may still succeed; failed tasks will be marked individually.
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

              // One claim per rollup with balance, plus distribute + a single
              // warehouse withdraw shared across the whole batch.
              const claimsPerRollup = (delegation.rollupRewardsByRollup ?? []).filter(
                (r) => r.rewards > 0n,
              )
              const totalTxs = claimsPerRollup.length + 1 // claims + distribute
              const claimsLabel = claimsPerRollup
                .map((r) => `claim v${r.rollupVersion}`)
                .join(", ")

              return (
                <div
                  key={delegation.splitContract}
                  className="bg-parchment/5 border border-parchment/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-chartreuse/20 text-chartreuse text-xs font-bold uppercase tracking-wide">
                        <Icon name="users" size="sm" />
                        {delegation.providerName || `Provider ${delegation.providerId}`}
                      </span>
                      <span className="text-xs text-parchment/40">
                        {userPercentage}% yours
                      </span>
                      {delegation.manualPayoutAuditUrl && (
                        // The operator has switched to out-of-protocol
                        // distribution, but this delegation still has
                        // claimable on-chain balance accrued before
                        // the switch. The user can sweep it now;
                        // future rewards will come out of protocol.
                        <a
                          href={delegation.manualPayoutAuditUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Operator distributes future rewards out of protocol. Claim sweeps remaining on-chain balance."
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-oracle-standard uppercase tracking-wider bg-aqua/10 border border-aqua/40 text-aqua hover:bg-aqua/20 transition-colors"
                        >
                          <Icon name="info" size="sm" />
                          Manual payout next
                        </a>
                      )}
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
                    {totalTxs} transactions: {claimsLabel ? `${claimsLabel}, ` : ""}distribute (+ shared withdraw)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Manual-payout delegations with no remaining on-chain balance.
          Listed for transparency so the user knows where rewards for
          these delegations are arriving from. Delegations that DO
          have on-chain balance are in the main claimable list above
          with a "Manual payout next" badge — they can still be swept
          here during the transition window. */}
      {manualPayoutDelegations.length > 0 && (
        <div>
          <div className="text-xs text-parchment/40 uppercase tracking-wide mb-3">
            Direct from operator ({manualPayoutDelegations.length})
          </div>
          <div className="space-y-2">
            {manualPayoutDelegations.map((delegation) => (
              <div
                key={delegation.splitContract}
                className="bg-aqua/5 border border-aqua/30 p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-aqua/20 text-aqua text-xs font-bold uppercase tracking-wide">
                    <Icon name="info" size="sm" />
                    {delegation.providerName || `Provider ${delegation.providerId}`}
                  </span>
                  <span className="text-xs text-parchment/60">
                    Receives rewards directly from operator
                  </span>
                </div>
                {delegation.manualPayoutAuditUrl && (
                  <a
                    href={delegation.manualPayoutAuditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-aqua hover:underline shrink-0"
                  >
                    Audit reports →
                  </a>
                )}
              </div>
            ))}
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
                key={`${coinbase.address}-${coinbase.rollupAddress}`}
                className="bg-parchment/5 border border-parchment/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-parchment/20 text-parchment/80 text-xs font-bold uppercase tracking-wide">
                      <Icon name="wallet" size="sm" />
                      Coinbase
                    </span>
                    <span className="font-mono text-xs text-parchment/60">
                      {coinbase.address.slice(0, 6)}...{coinbase.address.slice(-4)}
                    </span>
                    {coinbase.rollupVersion !== undefined && (
                      <span
                        className="font-oracle-standard text-[10px] uppercase tracking-wide bg-aqua/15 border border-aqua/30 text-aqua px-2 py-0.5"
                        title={`Rollup contract: ${coinbase.rollupAddress}`}
                      >
                        Rollup v{coinbase.rollupVersion}
                      </span>
                    )}
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
      {warehouseWithdrawal > 0n && (
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
                {formatTokenAmountFull(warehouseWithdrawal, decimals, symbol)}
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

      {/* Claim Button — no longer gated by the configured rollup's `isRewardsClaimable`.
          Per-task rollups handle their own gating; failed tasks surface via retry. */}
      <button
        onClick={onStartClaiming}
        disabled={isDisabled || !hasRewards}
        className="w-full py-4 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!hasRewards ? "No Rewards to Claim" : "Add All to Batch"}
      </button>

      {/* Transaction Info */}
      {hasRewards && (
        <p className="text-xs text-parchment/40 text-center">
          Adds every claim leg to your transaction cart with the right execution order.
          Open the cart panel to review and sign.
        </p>
      )}
    </div>
  )
}
