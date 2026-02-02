import { forwardRef, useState } from "react"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import { formatTokenAmount, formatTokenAmountFull } from "@/utils/atpFormatters"
import { ManageRewardsAddressesModal } from "@/components/RewardsManagement"
import { ClaimAllRewardsModal } from "@/components/ClaimAllRewardsModal"
import type { DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { CoinbaseBreakdown } from "@/hooks/rewards/rewardsTypes"

interface ATPStakingOverviewClaimableRewardsProps {
  totalRewards: bigint
  selfStakeRewards?: bigint
  pendingWarehouseWithdrawal?: bigint
  isRewardsClaimable?: boolean
  isExpanded: boolean
  onToggle: () => void
  decimals: number
  symbol: string
  delegationBreakdown?: DelegationBreakdown[]
  coinbaseBreakdown?: CoinbaseBreakdown[]
  onClaimSuccess?: () => void
}

/**
 * Displays claimable delegation rewards and self-stake rewards
 */
export const ATPStakingOverviewClaimableRewards = forwardRef<HTMLDivElement, ATPStakingOverviewClaimableRewardsProps>(
  ({ totalRewards, selfStakeRewards = 0n, pendingWarehouseWithdrawal = 0n, isRewardsClaimable = true, isExpanded, onToggle, decimals, symbol, delegationBreakdown = [], coinbaseBreakdown = [], onClaimSuccess }, ref) => {
    const [isManageModalOpen, setIsManageModalOpen] = useState(false)
    const [isClaimAllModalOpen, setIsClaimAllModalOpen] = useState(false)

    // Combined total rewards (delegation + self-stake)
    const combinedTotalRewards = totalRewards + selfStakeRewards

    return (
      <>
        <div ref={ref} className="relative border border-parchment/20 p-4 hover:border-parchment/30 transition-colors">
          <button
            onClick={onToggle}
            className="w-full flex items-start justify-between"
          >
            <div className="text-left w-full">
              <div className="flex items-center gap-1 mb-1">
                <Icon name="gift" size="md" className="flex-shrink-0 text-parchment/60" />
                <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Claimable Rewards</div>
                <TooltipIcon
                  content="Total rewards earned from staking that are currently available to claim."
                  size="sm"
                  maxWidth="max-w-xs"
                />
              </div>
              <div className="font-mono text-2xl font-bold text-chartreuse">
                {formatTokenAmountFull(combinedTotalRewards, decimals, symbol)}
              </div>

            </div>
            <Icon
              name="chevronDown"
              size="lg"
              className={`text-parchment/60 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-ink border border-parchment/20 p-4 z-10 shadow-lg">
              {/* Delegation Rewards Section */}
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Delegation Rewards</div>
                <div className="font-mono text-base font-bold text-parchment">
                  {formatTokenAmount(totalRewards, decimals, symbol)}
                </div>
                <div className="text-xs text-parchment/50 mt-1">
                  Earned from staking through providers
                </div>
              </div>

              {/* Self-Stake Rewards Section */}
              <div className="mt-4 pt-4 border-t border-parchment/10">
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1 font-oracle-standard">Self-Stake Rewards</div>
                <div className="font-mono text-base font-bold text-parchment">
                  {formatTokenAmount(selfStakeRewards, decimals, symbol)}
                </div>
                <div className="text-xs text-parchment/50 mt-1">
                  Earned from your coinbase addresses
                </div>
              </div>

              {/* Rewards Locked Warning */}
              {!isRewardsClaimable && (
                <div className="mt-4 pt-4 border-t border-parchment/10">
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-2">
                    <Icon name="lock" size="sm" className="text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-200">
                      Rewards are currently locked
                    </span>
                  </div>
                </div>
              )}

              {/* Info message when no rewards */}
              {combinedTotalRewards === 0n && (
                <div className="mt-4 pt-4 border-t border-parchment/10">
                  <div className="flex items-start gap-2 text-xs text-parchment/60">
                    <Icon name="info" size="sm" className="flex-shrink-0 mt-0.5 text-chartreuse/60" />
                    <p>
                      Rewards will appear here once earned from delegations or sequencer coinbase addresses.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-parchment/10 space-y-2">
                {/* Claim All Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsClaimAllModalOpen(true)
                  }}
                  disabled={!isRewardsClaimable || combinedTotalRewards === 0n}
                  className="w-full py-2 bg-chartreuse text-ink text-sm font-bold uppercase tracking-wide hover:bg-chartreuse/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="gift" size="sm" />
                  Claim All Rewards
                </button>

                {/* Manage Addresses Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsManageModalOpen(true)
                  }}
                  className="w-full py-2 bg-parchment/10 border border-parchment/20 text-parchment text-sm font-bold uppercase tracking-wide hover:bg-parchment/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="settings" size="sm" />
                  Manage Addresses
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manage Rewards Modal */}
        <ManageRewardsAddressesModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
        />

        {/* Claim All Rewards Modal */}
        <ClaimAllRewardsModal
          isOpen={isClaimAllModalOpen}
          onClose={() => setIsClaimAllModalOpen(false)}
          delegations={delegationBreakdown}
          coinbases={coinbaseBreakdown}
          pendingWarehouseWithdrawal={pendingWarehouseWithdrawal}
          onSuccess={onClaimSuccess}
        />
      </>
    )
  }
)

ATPStakingOverviewClaimableRewards.displayName = 'ATPStakingOverviewClaimableRewards'
