import { useMemo } from "react"
import { useAccount } from "wagmi"
import { useFeeAssetTokenDetails } from "@/hooks/rollup"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import { useSplitsWarehouse } from "@/hooks/splits/useSplitsWarehouse"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import {
  buildDelegationClaimEntries,
  buildWarehouseWithdrawEntry,
  getRecoveryDustThreshold,
  type ClaimCartEntry,
} from "@/utils/claimCart"
import { Icon } from "@/components/Icon"
import { contracts } from "@/contracts"
import type { Address } from "viem"

interface DelegationClaim {
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  /** Canonical rollup unclaimed balance — informational only; the helper reads
   *  the canonical balance out of `rollupRewardsByRollup`. Kept here for any
   *  caller-side gating (e.g., filtering out delegations with zero rewards). */
  rewards: bigint
  /** Required for the helper to fan out per-rollup claims. */
  rollupRewardsByRollup?: Array<{ rollupAddress: Address; rollupVersion: string; rewards: bigint }>
  /** Tokens already on the split contract awaiting distribute. Needed so a
   *  partially-executed claim (claim ran, distribute didn't) can still be
   *  recovered as a distribute-only entry. */
  splitContractBalance?: bigint
  providerName?: string | null
  providerId?: number
  /**
   * Operator distributes rewards out of protocol via the
   * `aztec-staking-payout` tool. The bulk-claim queue still includes
   * this delegation when the underlying dust-aware predicate finds
   * on-chain balance to sweep (transition cleanup); it drops out
   * naturally once the split is drained. The per-row claim button
   * surfaces the audit link in place of the standard CTA when there's
   * nothing left to claim.
   */
  manualPayoutAuditUrl?: string
}

interface ClaimAllDelegationRewardsButtonProps {
  delegations: DelegationClaim[]
  onSuccess?: () => void
}

/**
 * Adds every delegation's claim flow (claim per rollup with balance →
 * distribute) plus a single warehouse withdraw at the end to the transaction
 * cart. Routes through the same `buildDelegationClaimEntries` helper as the
 * per-delegation button and the "Claim All Rewards" modal, so all three
 * produce identical cart entries given identical inputs.
 */
export const ClaimAllDelegationRewardsButton = ({
  delegations,
  onSuccess,
}: ClaimAllDelegationRewardsButtonProps) => {
  const { address: beneficiary } = useAccount()
  const { feeAssetAddress: tokenAddress, decimals, symbol } = useFeeAssetTokenDetails()
  const { isRewardsClaimable } = useIsRewardsClaimable()
  const { addTransaction, checkTransactionInQueue, openCart, replaceTransactionByTx } = useTransactionCart()

  // Warehouse is the same per-token across all delegations; resolve from the first one.
  const firstSplit = delegations[0]?.splitContract
  const { warehouseAddress } = useSplitsWarehouse(firstSplit)

  // Filter to delegations that have *anything* claimable — canonical, stranded
  // on a non-canonical rollup, or already swept into the split contract but
  // awaiting distribute. The `splitContractBalance` arm uses the same dust
  // threshold as `buildDelegationClaimEntries` so the button's "Add All (N)"
  // count matches what actually gets queued; a bare `> 0n` here would let
  // 0xSplits v2's 1-wei post-distribute residue inflate the count even
  // though the builder discards those delegations downstream.
  // Filter to delegations with anything actually claimable on-chain.
  // We INCLUDE manual-payout delegations here when they still have
  // on-chain balance — the split contracts are permissionless, so a
  // delegator can sweep the residual balance themselves even after
  // the operator has switched to out-of-protocol distribution. The
  // per-row claim button collapses to an audit-link CTA only when
  // there's nothing left to sweep. Without this, transition-period
  // balances would silently strand.
  const dustThreshold = useMemo(() => getRecoveryDustThreshold(decimals ?? 18), [decimals])
  const claimableDelegations = useMemo(() => {
    const canonicalRollup = contracts.rollup.address.toLowerCase()
    return delegations.filter((d) => {
      const perRollup = d.rollupRewardsByRollup ?? []
      return perRollup.some((r) => r.rewards > 0n)
        || (d.splitContractBalance ?? 0n) >= dustThreshold
        || (d.rewards > 0n && !perRollup.some((r) => r.rollupAddress.toLowerCase() === canonicalRollup))
    })
  }, [delegations, dustThreshold])

  const isReady = !!tokenAddress && !!beneficiary && !!warehouseAddress

  // Build the candidate entries up-front so we can detect "in batch" and dedupe.
  //
  // `entries` are per-delegation (claims + distribute, unique calldata per
  // entry). `withdraw` is shared across all delegations for the same
  // user/token, so its raw signature collides with any prior withdraw the
  // user queued from another entry point. We split them so:
  //   - `isInBatch` only considers `entries` (a sibling delegation's
  //     withdraw shouldn't lock this button).
  //   - On add we route `withdraw` through `replaceTransactionByTx` so a
  //     newly-built withdraw (wired to the LATEST distribute group) cleanly
  //     supersedes any prior one.
  const built = useMemo(() => {
    if (!isReady || !tokenAddress || !beneficiary || !warehouseAddress) {
      return { entries: [] as ClaimCartEntry[], withdraw: null as ClaimCartEntry | null }
    }
    const entries: ClaimCartEntry[] = []
    let lastDistributeGroup: string | null = null
    for (const d of claimableDelegations) {
      const providerLabel = d.providerName ?? (d.providerId !== undefined ? `Provider ${d.providerId}` : "delegation")
      const { entries: delegationEntries, distributeGroup } = buildDelegationClaimEntries({
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
      entries.push(...delegationEntries)
      if (distributeGroup) lastDistributeGroup = distributeGroup
    }
    const withdraw = lastDistributeGroup
      ? buildWarehouseWithdrawEntry({
          warehouseAddress,
          beneficiary,
          tokenAddress,
          dependsOnDistributeGroup: lastDistributeGroup,
        })
      : null
    return { entries, withdraw }
  }, [claimableDelegations, isReady, tokenAddress, beneficiary, warehouseAddress, decimals, symbol])

  // "In batch" requires every entry this button would queue to already be in
  // the cart — per-delegation claims/distributes AND the warehouse withdraw
  // (treated as a shared singleton; any queued withdraw counts because there
  // is only one). Using `.every()` keeps the button actionable when state
  // changes add a new candidate (a fresh rollup balance, a new delegation):
  // those new entries get queued on the next click instead of being locked
  // out by a single already-queued entry.
  const candidates = built.withdraw ? [...built.entries, built.withdraw] : built.entries
  const isInBatch = candidates.length > 0
    && candidates.every((e) => checkTransactionInQueue(e.transaction))

  const handleAddAllToBatch = () => {
    for (const entry of built.entries) {
      addTransaction(entry, { preventDuplicate: true })
    }
    if (built.withdraw) {
      replaceTransactionByTx(built.withdraw.transaction, built.withdraw)
    }
    onSuccess?.()
    openCart()
  }

  if (claimableDelegations.length === 0 || isRewardsClaimable === false) {
    return null
  }

  const handleClick = () => {
    if (isInBatch) {
      openCart()
      return
    }
    handleAddAllToBatch()
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isReady}
      className={`px-4 py-1.5 border font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
        isInBatch
          ? 'border-chartreuse/40 bg-chartreuse/10 text-chartreuse hover:bg-chartreuse/20'
          : 'border-chartreuse bg-chartreuse text-ink hover:bg-chartreuse/90'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={
        isInBatch
          ? "Already in the transaction batch — open the cart to execute"
          : "Add all delegation claim flows to the transaction batch"
      }
    >
      {isInBatch ? (
        <span className="flex items-center gap-1.5">
          <Icon name="shoppingCart" size="sm" />
          <span>In Batch — Open Cart</span>
        </span>
      ) : (
        `Add All (${claimableDelegations.length}) to Batch`
      )}
    </button>
  )
}
