import { createPortal } from "react-dom"
import { useAccount } from "wagmi"
import { Icon } from "@/components/Icon"
import { useFeeAssetTokenDetails } from "@/hooks/rollup"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import { useSplitsWarehouse } from "@/hooks/splits/useSplitsWarehouse"
import { ClaimAllRewardsSummary } from "./ClaimAllRewardsSummary"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useAlert } from "@/contexts/AlertContext"
import {
  buildDelegationClaimEntries,
  buildCoinbaseClaimEntry,
  buildWarehouseWithdrawEntry,
  type ClaimCartEntry,
} from "@/utils/claimCart"
import type { DelegationBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { CoinbaseBreakdown } from "@/hooks/rewards/rewardsTypes"

interface ClaimAllRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  delegations: DelegationBreakdown[]
  coinbases: CoinbaseBreakdown[]
  pendingWarehouseWithdrawal?: bigint
  onSuccess?: () => void
}

/**
 * Fans every claim leg (delegation per-rollup claims/distribute, coinbase
 * claims, and a single warehouse withdraw at the end) into the transaction
 * cart with `dependsOn` wiring, then opens the cart. Routes through the
 * shared `claimCart` helpers so this matches the per-delegation and bulk
 * delegation entry points entry-for-entry.
 */
export const ClaimAllRewardsModal = ({
  isOpen,
  onClose,
  delegations,
  coinbases,
  pendingWarehouseWithdrawal = 0n,
  onSuccess,
}: ClaimAllRewardsModalProps) => {
  const { address: beneficiary } = useAccount()
  const { symbol, decimals, feeAssetAddress: tokenAddress } = useFeeAssetTokenDetails()
  const { isRewardsClaimable } = useIsRewardsClaimable()
  const { addTransaction, openCart, replaceTransactionByTx } = useTransactionCart()
  const { showAlert } = useAlert()

  // Resolve warehouse via the first delegation's split contract. All splits
  // funnel into the same SplitsWarehouse for a given token, so any split works.
  const firstSplit = delegations.find((d) => d.rewards > 0n)?.splitContract ?? delegations[0]?.splitContract
  const { warehouseAddress } = useSplitsWarehouse(firstSplit)

  const handleAddAllToBatch = () => {
    if (!tokenAddress || !beneficiary) {
      showAlert("error", "Wallet or token address not ready")
      return
    }

    const entriesToAdd: ClaimCartEntry[] = []
    let lastDistributeGroup: string | null = null

    // Per-delegation entries from the shared helper.
    //
    // We deliberately don't filter out manual-payout delegations here.
    // The split contracts are permissionless, so a delegator can still
    // sweep on-chain balances that accrued before the operator
    // switched to out-of-protocol distribution.
    // `buildDelegationClaimEntries` returns no entries when a
    // delegation has nothing claimable (dust threshold included), so
    // manual-payout delegations with a clean on-chain slate naturally
    // contribute zero to the cart.
    for (const d of delegations) {
      const providerLabel = d.providerName ?? `Provider ${d.providerId}`
      const { entries, distributeGroup } = buildDelegationClaimEntries({
        splitContract: d.splitContract,
        providerTakeRate: d.providerTakeRate,
        providerRewardsRecipient: d.providerRewardsRecipient,
        providerLabel,
        rollupRewardsByRollup: d.rollupRewardsByRollup ?? [],
        beneficiary,
        tokenAddress,
        decimals: decimals ?? 18,
        symbol: symbol ?? "",
        splitContractBalance: d.splitContractBalance,
      })
      entriesToAdd.push(...entries)
      if (distributeGroup) lastDistributeGroup = distributeGroup
    }

    // Per-coinbase entries.
    for (const c of coinbases) {
      if (c.rewards === 0n) continue
      entriesToAdd.push(
        buildCoinbaseClaimEntry({
          coinbase: c.address,
          rollupAddress: c.rollupAddress,
          rollupVersion: c.rollupVersion,
          rewards: c.rewards,
          decimals: decimals ?? 18,
          symbol: symbol ?? "",
        }),
      )
    }

    // Per-delegation + per-coinbase entries have unique calldata; safe to add
    // with `preventDuplicate`. Subsequent "Add All" clicks won't duplicate
    // them.
    for (const entry of entriesToAdd) {
      addTransaction(entry, { preventDuplicate: true })
    }

    // The warehouse withdraw's calldata is identical across delegations for
    // the same user/token. Using `addTransaction` with `preventDuplicate`
    // would silently drop it on a re-add and leave a stale dependency on a
    // previous distribute group — stranding any newly-added delegation's
    // share in the warehouse. Route it through `replaceTransactionByTx` so
    // the fresh entry (wired to the LATEST distribute group) supersedes any
    // prior withdraw.
    const needsWithdraw = lastDistributeGroup !== null || pendingWarehouseWithdrawal > 0n
    if (needsWithdraw && warehouseAddress) {
      const withdrawEntry = buildWarehouseWithdrawEntry({
        warehouseAddress,
        beneficiary,
        tokenAddress,
        dependsOnDistributeGroup: lastDistributeGroup,
      })
      replaceTransactionByTx(withdrawEntry.transaction, withdrawEntry)
    }

    onSuccess?.()
    openCart()
    onClose()
  }

  const handleClose = () => {
    onClose()
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
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-parchment/60 hover:text-parchment transition-colors"
        >
          <Icon name="x" size="md" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 mt-1">
              <Icon name="gift" size="lg" className="text-chartreuse w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-arizona-serif text-2xl font-medium text-parchment mb-2">
                Claim All Rewards
              </h2>
              <p className="text-parchment/80 text-sm leading-relaxed">
                Review your rewards below, then add them all to the transaction batch. The cart panel handles execution.
              </p>
            </div>
          </div>

          <ClaimAllRewardsSummary
            delegations={delegations}
            coinbases={coinbases}
            pendingWarehouseWithdrawal={pendingWarehouseWithdrawal}
            decimals={decimals ?? 18}
            symbol={symbol ?? ""}
            isRewardsClaimable={isRewardsClaimable ?? false}
            onStartClaiming={handleAddAllToBatch}
            isDisabled={false}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
