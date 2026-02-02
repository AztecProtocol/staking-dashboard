import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { TooltipIcon } from "@/components/Tooltip"
import type { ATPData } from "@/hooks/atp"

interface ATPDetailsSummaryProps {
  atp: ATPData
  totalStaked: bigint
  delegationRewards: bigint
  stakeableAmount?: bigint
  governancePower?: bigint
}

/**
 * Summary statistics component for ATP Details Modal
 * Displays allocation, staked amount, available to stake, and reward totals
 */
export const ATPDetailsSummary = ({
  atp,
  totalStaked,
  delegationRewards,
  stakeableAmount,
  governancePower
}: ATPDetailsSummaryProps) => {
  const { symbol, decimals, isLoading: isLoadingTokenDetails } = useStakingAssetTokenDetails()

  const allocation = atp.allocation || 0n
  const totalRewards = delegationRewards

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">Total Funds</div>
            <TooltipIcon
              content="Total amount of tokens allocated to this Token Vault from the vesting schedule."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-base font-bold text-parchment">
            {isLoadingTokenDetails ? "Loading..." : formatTokenAmount(allocation, decimals, symbol)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">Total Staked</div>
            <TooltipIcon
              content="Total amount currently staked across all self stake and delegations."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-base font-bold text-aqua">
            {isLoadingTokenDetails ? "Loading..." : formatTokenAmount(totalStaked, decimals, symbol)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">Available to Stake</div>
            <TooltipIcon
              content="Amount of tokens available to stake from this Token Vault. Can be used for self-staking or delegation."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-base font-bold text-parchment">
            {isLoadingTokenDetails ? "Loading..." : formatTokenAmount(stakeableAmount ?? 0n, decimals, symbol)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">Allocated to Governance</div>
            <TooltipIcon
              content="Amount of tokens from this Token Vault currently allocated to governance voting power."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-base font-bold text-parchment">
            {isLoadingTokenDetails ? "Loading..." : formatTokenAmount(governancePower ?? 0n, decimals, symbol)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">Total Staking Rewards</div>
            <TooltipIcon
              content="Combined rewards earned from self staking and delegations."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-base font-bold text-chartreuse">
            {isLoadingTokenDetails ? "Loading..." : formatTokenAmount(totalRewards, decimals, symbol)}
          </div>
        </div>
      </div>
    </>
  )
}