import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { useRemoveManualSplit } from "@/hooks/rewards"
import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { calculateUserShareFromTakeRate } from "@/utils/rewardCalculations"
import type { SplitContractWithSource } from "./types"
import type { Address } from "viem"

interface SplitContractItemProps {
  splitContract: SplitContractWithSource
  decimals: number
  symbol: string
  tokenAddress: Address
  isRewardsClaimable: boolean
  onRemove?: () => void
  isRemoving: boolean
}

const SplitContractItem = ({
  splitContract,
  decimals,
  symbol,
  tokenAddress,
  isRewardsClaimable,
  onRemove,
  isRemoving
}: SplitContractItemProps) => {
  const { address: splitAddress, source, providerName, providerTakeRate } = splitContract

  // Fetch rewards for this split contract
  const { rewards: rollupBalance, isLoading: isLoadingRollup } = useSequencerRewards(splitAddress)
  const { balance: splitContractBalance, isLoading: isLoadingSplitContract } = useERC20Balance(tokenAddress, splitAddress)

  const isLoading = isLoadingRollup || isLoadingSplitContract

  const totalRewards = (rollupBalance || 0n) + (splitContractBalance || 0n)
  const isDelegation = source === "delegation"

  // Calculate user's share if we have the take rate (delegation splits)
  const userShare = providerTakeRate !== undefined
    ? calculateUserShareFromTakeRate(totalRewards, providerTakeRate)
    : totalRewards // For manual splits, show full amount

  const userPercentage = providerTakeRate !== undefined
    ? ((10000 - providerTakeRate) / 100).toFixed(1)
    : null

  return (
    <div className="bg-parchment/5 border border-parchment/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Source badge + allocation */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isDelegation ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-chartreuse/20 text-chartreuse text-xs font-bold uppercase tracking-wide">
                <Icon name="users" size="sm" />
                {providerName || "Delegation"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-parchment/20 text-parchment/80 text-xs font-bold uppercase tracking-wide">
                <Icon name="plus" size="sm" />
                Manual
              </span>
            )}
            {userPercentage && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ink border border-chartreuse/40 text-chartreuse text-xs font-mono">
                {userPercentage}% yours
              </span>
            )}
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm text-parchment truncate">
              {splitAddress.slice(0, 10)}...{splitAddress.slice(-8)}
            </span>
            <CopyButton text={splitAddress} size="sm" />
          </div>

          {/* Rewards */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Icon name="loader" size="sm" className="animate-spin text-parchment/60" />
              <span className="text-parchment/60 text-sm">Loading...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-0.5">
                  Your Share
                </div>
                <div className="font-mono text-lg font-bold text-chartreuse">
                  {formatTokenAmountFull(userShare, decimals, symbol)}
                </div>
              </div>
              {userPercentage && totalRewards > 0n && (
                <div className="text-xs text-parchment/40">
                  {userPercentage}% of {formatTokenAmountFull(totalRewards, decimals, symbol)} total
                </div>
              )}
              {!userPercentage && (
                <p className="text-xs text-parchment/40">
                  Your share depends on split allocation
                </p>
              )}
            </div>
          )}
        </div>

        {/* Remove Button - only for manual splits */}
        {!isDelegation && onRemove && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="p-2 text-parchment/60 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Remove split contract"
          >
            <Icon name="trash2" size="sm" />
          </button>
        )}
      </div>

      {/* Info about claiming */}
      {userShare > 0n && !isLoading && (
        <div className="mt-3 pt-3 border-t border-parchment/10">
          {isRewardsClaimable ? (
            <p className="text-xs text-parchment/60">
              To claim rewards, go to your Token Vault details and use the delegation claim flow.
            </p>
          ) : (
            <p className="text-xs text-parchment/60">
              Rewards are currently locked. Check back later.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface SplitContractListProps {
  splitContracts: SplitContractWithSource[]
  decimals: number
  symbol: string
  tokenAddress: Address | undefined
  isRewardsClaimable: boolean
  isLoading?: boolean
  onRefetch?: () => void
}

/**
 * Display list of split contracts (both from delegations and manually-added)
 */
export const SplitContractList = ({
  splitContracts,
  decimals,
  symbol,
  tokenAddress,
  isRewardsClaimable,
  isLoading,
  onRefetch
}: SplitContractListProps) => {
  const { removeManualSplit, isPending: isRemoving } = useRemoveManualSplit()

  const handleRemove = async (address: Address) => {
    await removeManualSplit(address)
    onRefetch?.()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="loader" size="md" className="animate-spin text-parchment/60" />
      </div>
    )
  }

  if (splitContracts.length === 0) {
    return (
      <div className="py-8 text-center">
        <Icon name="inbox" size="lg" className="text-parchment/30 mx-auto mb-2" />
        <p className="text-parchment/60 text-sm">No split contracts found</p>
        <p className="text-parchment/40 text-xs mt-1">
          Delegate to a provider to automatically track split contracts, or add one manually.
        </p>
      </div>
    )
  }

  if (!tokenAddress) {
    return (
      <div className="py-8 text-center">
        <Icon name="alertCircle" size="lg" className="text-parchment/30 mx-auto mb-2" />
        <p className="text-parchment/60 text-sm">Token address not available</p>
      </div>
    )
  }

  // Separate delegation splits and manual splits for display
  const delegationSplits = splitContracts.filter(s => s.source === "delegation")
  const manualSplits = splitContracts.filter(s => s.source === "manual")

  return (
    <div className="space-y-4">
      {/* Delegation splits */}
      {delegationSplits.length > 0 && (
        <div>
          <div className="text-xs text-parchment/40 uppercase tracking-wide mb-2">
            From Delegations ({delegationSplits.length})
          </div>
          <div className="space-y-3">
            {delegationSplits.map((split) => (
              <SplitContractItem
                key={split.address}
                splitContract={split}
                decimals={decimals}
                symbol={symbol}
                tokenAddress={tokenAddress}
                isRewardsClaimable={isRewardsClaimable}
                isRemoving={isRemoving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual splits */}
      {manualSplits.length > 0 && (
        <div>
          <div className="text-xs text-parchment/40 uppercase tracking-wide mb-2">
            Manually Added ({manualSplits.length})
          </div>
          <div className="space-y-3">
            {manualSplits.map((split) => (
              <SplitContractItem
                key={split.address}
                splitContract={split}
                decimals={decimals}
                symbol={symbol}
                tokenAddress={tokenAddress}
                isRewardsClaimable={isRewardsClaimable}
                onRemove={() => handleRemove(split.address)}
                isRemoving={isRemoving}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
