import { Icon } from "@/components/Icon"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import type { ClaimTask } from "@/hooks/rewards/useClaimAllRewards"

interface ClaimAllRewardsSuccessProps {
  completedTasks: ClaimTask[]
  decimals: number
  symbol: string
  onClose: () => void
}

/**
 * Success view after all rewards have been claimed
 */
export const ClaimAllRewardsSuccess = ({
  completedTasks,
  decimals,
  symbol,
  onClose
}: ClaimAllRewardsSuccessProps) => {
  const totalClaimed = completedTasks.reduce((sum, task) => sum + task.estimatedRewards, 0n)

  const delegationsClaimed = completedTasks.filter(t => t.type === 'delegation')
  const coinbasesClaimed = completedTasks.filter(t => t.type === 'coinbase')

  const delegationTotal = delegationsClaimed.reduce((sum, t) => sum + t.estimatedRewards, 0n)
  const coinbaseTotal = coinbasesClaimed.reduce((sum, t) => sum + t.estimatedRewards, 0n)

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-chartreuse/20 border-2 border-chartreuse rounded-full mb-4">
          <Icon name="check" size="lg" className="text-chartreuse w-8 h-8" />
        </div>
        <h3 className="font-arizona-serif text-xl font-medium text-parchment mb-1">
          Rewards Claimed!
        </h3>
        <p className="text-parchment/60 text-sm">
          All rewards have been successfully claimed to your wallet.
        </p>
      </div>

      {/* Total Claimed */}
      <div className="bg-chartreuse/10 border border-chartreuse/30 p-4 text-center">
        <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">
          Total Claimed
        </div>
        <div className="font-mono text-3xl font-bold text-chartreuse">
          {formatTokenAmountFull(totalClaimed, decimals, symbol)}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {/* Delegation Summary */}
        {delegationsClaimed.length > 0 && (
          <div className="bg-parchment/5 border border-parchment/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="users" size="sm" className="text-chartreuse" />
                <span className="text-sm text-parchment">
                  {delegationsClaimed.length} Delegation{delegationsClaimed.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-chartreuse">
                {formatTokenAmountFull(delegationTotal, decimals, symbol)}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {delegationsClaimed.map(task => (
                <div key={task.id} className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">{task.displayName}</span>
                  <span className="font-mono text-parchment/60">
                    {formatTokenAmountFull(task.estimatedRewards, decimals, symbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coinbase Summary */}
        {coinbasesClaimed.length > 0 && (
          <div className="bg-parchment/5 border border-parchment/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="wallet" size="sm" className="text-parchment/80" />
                <span className="text-sm text-parchment">
                  {coinbasesClaimed.length} Coinbase{coinbasesClaimed.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-chartreuse">
                {formatTokenAmountFull(coinbaseTotal, decimals, symbol)}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {coinbasesClaimed.map(task => (
                <div key={task.id} className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">{task.displayName}</span>
                  <span className="font-mono text-parchment/60">
                    {formatTokenAmountFull(task.estimatedRewards, decimals, symbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Text */}
      <div className="text-center">
        <p className="text-xs text-parchment/40">
          Delegation rewards have been withdrawn to your wallet.
          <br />
          Self-stake rewards have been sent to your coinbase address.
        </p>
      </div>

      {/* Done Button */}
      <button
        onClick={onClose}
        className="w-full py-4 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all"
      >
        Done
      </button>
    </div>
  )
}
