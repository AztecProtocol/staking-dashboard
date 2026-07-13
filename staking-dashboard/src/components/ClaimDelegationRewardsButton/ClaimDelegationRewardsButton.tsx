import { useAccount } from "wagmi"
import { useFeeAssetTokenDetails } from "@/hooks/rollup"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useWarehouseBalance } from "@/hooks/splits/useWarehouseBalance"
import { useSplitsWarehouse } from "@/hooks/splits/useSplitsWarehouse"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { Icon } from "@/components/Icon"
import {
  buildDelegationClaimEntries,
  buildWarehouseWithdrawEntry,
  type ClaimCartEntry,
} from "@/utils/claimCart"
import type { Address } from "viem"

interface ClaimDelegationRewardsButtonProps {
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  /** Used in cart-entry descriptions so the user can tell entries apart at a glance. */
  providerName?: string | null
  /** Full per-rollup `getSequencerRewards(splitContract)` breakdown. The helper
   *  picks out the canonical row and treats the rest as stranded balances to
   *  claim before the canonical claim. */
  rollupRewardsByRollup: Array<{ rollupAddress: Address; rollupVersion: string; rewards: bigint }>
  /**
   * When set, the operator distributes rewards out of protocol — the
   * button collapses to a disabled state with an "audit reports"
   * link rather than the standard claim CTA. Provided by the API on
   * each delegation row; see `DelegationBreakdown.manualPayoutAuditUrl`.
   */
  manualPayoutAuditUrl?: string
  onSuccess?: () => void
  variant?: 'default' | 'modal'
}

/**
 * Adds the delegation claim flow to the transaction cart. Entries come from the
 * shared `buildDelegationClaimEntries` helper so this matches the bulk-claim and
 * "claim all" entry points exactly — same labels, descriptions, and dependsOn
 * wiring.
 */
export const ClaimDelegationRewardsButton = ({
  splitContract,
  providerTakeRate,
  providerRewardsRecipient,
  providerName,
  rollupRewardsByRollup,
  manualPayoutAuditUrl,
  onSuccess,
  variant = 'default'
}: ClaimDelegationRewardsButtonProps) => {
  const { address: beneficiary } = useAccount()
  const { feeAssetAddress: tokenAddress, decimals, symbol } = useFeeAssetTokenDetails()

  const { warehouseAddress } = useSplitsWarehouse(splitContract)
  const { balance: splitContractBalance } = useERC20Balance(tokenAddress!, splitContract)
  const { balance: warehouseBalance } = useWarehouseBalance(warehouseAddress, beneficiary, tokenAddress)

  const { addTransaction, checkTransactionInQueue, openCart, replaceTransactionByTx } = useTransactionCart()

  const providerLabel = providerName ?? "delegation"

  const currentSplitBalance = splitContractBalance ?? 0n
  const currentWarehouseBalance = warehouseBalance ?? 0n
  const totalRollupRewards = rollupRewardsByRollup.reduce((sum, r) => sum + r.rewards, 0n)

  const hasRewards =
    totalRollupRewards > 0n ||
    currentSplitBalance > 0n ||
    currentWarehouseBalance > 0n

  const isReady = !!warehouseAddress && !!tokenAddress && !!beneficiary
  const isDisabled = !isReady || !hasRewards

  // Build the candidate entries up-front (without adding) so we can detect
  // whether any are already in the cart for the "in batch" indicator.
  //
  // `entries` (claims + distribute) have calldata unique to this delegation.
  // `withdraw` is a singleton across delegations for the same user/token —
  // its calldata is identical regardless of which delegation queued it. The
  // `isInBatch` derivation below treats it as "in batch when present" rather
  // than excluding it: with `addTransaction(..., preventDuplicate: true)` for
  // entries and `replaceTransactionByTx` for withdraw, the cart always ends
  // up with at most one withdraw, and whether *any* withdraw is queued is
  // exactly the signal we want.
  const built = (() => {
    if (!isReady || !tokenAddress || !beneficiary || !warehouseAddress) {
      return { entries: [], withdraw: null as ClaimCartEntry | null }
    }
    const { entries, distributeGroup } = buildDelegationClaimEntries({
      splitContract,
      providerTakeRate,
      providerRewardsRecipient,
      providerLabel,
      rollupRewardsByRollup,
      beneficiary,
      tokenAddress,
      decimals: decimals ?? 18,
      symbol: symbol ?? "",
      splitContractBalance: currentSplitBalance,
    })
    const withdraw = entries.length > 0 || currentWarehouseBalance > 0n
      ? buildWarehouseWithdrawEntry({
          warehouseAddress,
          beneficiary,
          tokenAddress,
          dependsOnDistributeGroup: distributeGroup,
        })
      : null
    return { entries, withdraw }
  })()
  // "In batch" requires every entry this button would queue to already be in
  // the cart — claims, distribute, AND the warehouse withdraw (treated as a
  // shared singleton; any queued withdraw counts because there is only one).
  // Using `.every()` rather than `.some()` makes the button stay actionable
  // when state changes add a new candidate (e.g. an additional rollup
  // balance, or a new delegation under the bulk button) — those new entries
  // get added on the next click instead of being locked out.
  const candidates = built.withdraw ? [...built.entries, built.withdraw] : built.entries
  const isInBatch = candidates.length > 0
    && candidates.every((e) => checkTransactionInQueue(e.transaction))

  const buttonClass = variant === 'modal'
    ? `px-6 py-3 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`
    : `px-3 py-1.5 border font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${isDisabled
      ? 'border-parchment/40 text-parchment/40 cursor-not-allowed'
      : 'border-chartreuse bg-chartreuse text-ink hover:bg-chartreuse/90'
    }`

  const handleAddToBatch = () => {
    for (const entry of built.entries) {
      addTransaction(entry, { preventDuplicate: true })
    }
    // Withdraw calldata is identical across delegations for the same user/token,
    // so `addTransaction` with `preventDuplicate` would silently drop a second
    // add — leaving the previously queued withdraw wired to an EARLIER
    // delegation's distribute and stranding this delegation's distributed
    // share in the warehouse. `replaceTransactionByTx` swaps any existing
    // withdraw entry for the fresh one (which depends on this delegation's
    // distribute group) atomically.
    if (built.withdraw) {
      replaceTransactionByTx(built.withdraw.transaction, built.withdraw)
    }
    onSuccess?.()
    openCart()
  }

  const handleClick = () => {
    if (isInBatch) {
      // Same as the add-path: let the parent (e.g., modal) close itself, then
      // surface the cart. Without `onSuccess` here, the modal stays open and
      // obscures the cart panel.
      onSuccess?.()
      openCart()
      return
    }
    handleAddToBatch()
  }

  const getButtonText = () => {
    if (!warehouseAddress) return 'Loading...'
    if (!hasRewards) return 'No Rewards'
    if (isInBatch) return variant === 'modal' ? 'In Batch — Open Cart' : 'In Batch'
    return variant === 'modal' ? 'Add to Batch' : 'Add'
  }

  const getTitle = () => {
    if (!warehouseAddress) return 'Loading warehouse address...'
    if (!hasRewards) return 'No rewards available to claim'
    if (isInBatch) return 'Already added to the transaction batch — open the cart to execute'
    if (manualPayoutAuditUrl) {
      // The split contracts are permissionless, so a delegator can always
      // sweep whatever's still on-chain even if the operator has moved
      // to out-of-protocol distribution. Future rewards for this
      // delegation will arrive directly from the operator instead.
      return 'Claim the on-chain balance for this delegation. Future rewards will be paid directly by the operator — see their audit reports.'
    }
    return 'Add the full delegation claim flow to the transaction batch'
  }

  // Off-chain payouts: operator distributes via the
  // `aztec-staking-payout` tool. We ONLY collapse to the audit-link
  // CTA when there's nothing on-chain left to claim. During the
  // transition (existing rollup-pending / split / warehouse balances
  // accrued before the switch), the on-chain claim flow still works
  // and the dashboard should expose it — otherwise a delegator can
  // get stranded if the operator forgot to wind down outstanding
  // balances. Placed after the hook calls so we don't violate the
  // rules of hooks.
  if (manualPayoutAuditUrl && !hasRewards) {
    return (
      <a
        href={manualPayoutAuditUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`${providerName ?? "This operator"} pays out rewards out of protocol. View their audit reports.`}
        className={
          variant === 'modal'
            ? "px-6 py-3 border border-aqua/40 bg-aqua/10 text-aqua font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-aqua/20 transition-colors inline-flex items-center justify-center gap-2"
            : "px-3 py-1.5 border border-aqua/40 bg-aqua/10 text-aqua font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap hover:bg-aqua/20 transition-colors inline-flex items-center gap-1.5"
        }
      >
        <Icon name="info" size="sm" />
        Manual payout
      </a>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled && !isInBatch}
      className={buttonClass}
      title={getTitle()}
    >
      {isInBatch ? (
        <span className="flex items-center justify-center gap-2">
          <Icon name="shoppingCart" size="sm" />
          <span>{getButtonText()}</span>
        </span>
      ) : (
        getButtonText()
      )}
    </button>
  )
}
