import { useMemo, useState } from "react"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import { PageHeader } from "@/components/PageHeader"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { TooltipIcon } from "@/components/Tooltip"
import { useFeeAssetTokenDetails } from "@/hooks/rollup"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import {
  useConnectedOperatorIdentities,
  useOperatorSplitContracts,
  useOperatorOnChainReads,
  type OperatorIdentity,
  type OperatorSplitContract,
} from "@/hooks/operator"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useAlert } from "@/contexts/AlertContext"
import {
  buildOperatorCommissionEntries,
  buildOperatorWarehouseWithdrawEntry,
  type OperatorSplitInputs,
} from "@/utils/operatorCommissionCart"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { formatBipsToPercentage } from "@/utils/formatNumber"
import type { CoinbaseBreakdown } from "@/hooks/rewards/rewardsTypes"

/**
 * Operator commission claim page. Visible only when the connected wallet is
 * `providerAdmin` or `providerRewardsRecipient` for at least one provider —
 * the navbar gates the link via the same detection hook, and we re-check
 * here so a deep-link or page reload still shows the empty/redirect state
 * cleanly.
 *
 * Commission lives in two places at any given moment:
 *
 *   1. **Pre-distribute** — tokens on a rollup waiting to be claimed
 *      (`getSequencerRewards(split)`) or already claimed but sitting on the
 *      split contract pre-distribute (`ERC20.balanceOf(split)`). These are
 *      per-split. The operator's share is `total * providerTakeRate / 10000`.
 *
 *   2. **Post-distribute** — already split and credited in the SplitsWarehouse
 *      keyed by `providerRewardsRecipient`. This is per-RECIPIENT, not
 *      per-split: many splits often share one recipient (`providerAdmin`
 *      defaults to recipient at registration). Reading the warehouse balance
 *      per-row double-counts when N splits → 1 recipient, so we read it
 *      once per distinct recipient and surface it as its own card.
 */
export default function OperatorPage() {
  const { address } = useAccount()
  const {
    all,
    asAdmin,
    asRecipient,
    isLoading: isLoadingIdentities,
    hasError: identitiesError,
    refetch: refetchIdentities,
  } = useConnectedOperatorIdentities()
  const { symbol, decimals, feeAssetAddress: tokenAddress } = useFeeAssetTokenDetails()
  const { isRewardsClaimable } = useIsRewardsClaimable()
  // Cosmetic filter — historical delegations are kept in the underlying data
  // (a now-exited delegator might still have unclaimed rollup rewards on the
  // split), but a fully-drained row adds noise without action. Default to
  // hiding so operators see actionable rows first.
  const [hideEmptySplits, setHideEmptySplits] = useState(true)

  // Splits paying any of our identities (one row per delegator × provider).
  const {
    splitContracts,
    isLoading: isLoadingSplits,
    hasErrors: splitsHaveErrors,
    refetch: refetchSplits,
  } = useOperatorSplitContracts(all)

  const indexerError = identitiesError || splitsHaveErrors
  // Fire-and-forget: refetch outcomes propagate through `hasError`/`hasErrors`
  // on the next render. We `void` the combined promise rather than awaiting
  // (the click handler is synchronous) and add a no-op `.catch` so a
  // rejection — should both refetches' retry budgets exhaust — doesn't
  // surface as an unhandled-rejection in tooling.
  const retryIndexer = () => {
    void Promise.all([refetchIdentities(), refetchSplits()]).catch(() => {})
  }

  const splitAddresses = useMemo(
    () => splitContracts.map((s) => s.splitContract),
    [splitContracts],
  )
  const distinctRecipients = useMemo<Address[]>(() => {
    const set = new Map<string, Address>()
    for (const s of splitContracts) set.set(s.providerRewardsRecipient.toLowerCase(), s.providerRewardsRecipient)
    return [...set.values()]
  }, [splitContracts])

  // ONE multicall for everything we need: rollup rewards per split, ERC20
  // balance on each split, and warehouse balance per distinct recipient.
  const {
    warehouseAddress,
    rollupRewardsBySplit,
    splitBalances,
    warehouseBalances,
    isLoading: isLoadingChainReads,
  } = useOperatorOnChainReads({
    splits: splitAddresses,
    recipients: distinctRecipients,
    tokenAddress,
  })

  // Totals — explicitly separated so the UI can show pre-distribute and
  // warehouse balances without ever double-counting recipient-level money.
  const totals = useMemo(() => {
    let pendingDistribute = 0n
    for (const s of splitContracts) {
      const rollupTotal = (rollupRewardsBySplit.get(s.splitContract.toLowerCase()) ?? []).reduce(
        (sum, r) => sum + r.rewards,
        0n,
      )
      const onSplit = splitBalances.get(s.splitContract.toLowerCase()) ?? 0n
      pendingDistribute += ((rollupTotal + onSplit) * BigInt(s.providerTakeRate)) / 10000n
    }
    let inWarehouse = 0n
    for (const balance of warehouseBalances.values()) inWarehouse += balance
    return { pendingDistribute, inWarehouse, total: pendingDistribute + inWarehouse }
  }, [splitContracts, rollupRewardsBySplit, splitBalances, warehouseBalances])

  return (
    <>
      <PageHeader
        title="Operator Commission"
        description="Claim your share of delegator rewards routed through split contracts."
        tooltip="When a delegator stakes via your provider, a Split contract is created that routes a percentage of rewards to your configured rewards recipient. This page surfaces every split paying you and bundles the full claim chain (claim → distribute → withdraw) into the transaction cart."
      />

      <IdentitiesSummary
        address={address}
        asAdmin={asAdmin}
        asRecipient={asRecipient}
        isLoading={isLoadingIdentities}
      />

      {indexerError && (
        <div className="mb-4 px-4 py-3 bg-vermillion/10 border border-vermillion/30 text-vermillion text-sm flex items-center justify-between gap-3 flex-wrap">
          <span>
            Indexer request failed. The list below may be incomplete or out of date — totals computed from on-chain reads are still accurate for whichever splits did load.
          </span>
          <button
            onClick={retryIndexer}
            className="px-3 py-1.5 border border-vermillion/40 text-vermillion font-oracle-standard text-xs uppercase tracking-wider hover:bg-vermillion/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!isRewardsClaimable && (
        <div className="mb-4 px-4 py-3 bg-vermillion/10 border border-vermillion/30 text-vermillion text-sm">
          Rewards are currently locked on the network. You can queue claims now and execute them once rewards unlock.
        </div>
      )}

      <TotalsCard
        totals={totals}
        decimals={decimals ?? 18}
        symbol={symbol ?? ""}
        canBatch={splitContracts.length > 0 && !!tokenAddress && !!warehouseAddress}
        onAddAll={() => {
          if (!tokenAddress || !warehouseAddress) return null
          // Filter with the SAME predicate the visible list uses, so
          // "Add All" only queues splits the operator can actually see.
          // Without this, every previously-distributed split (1-wei
          // 0xSplits v2 residue) gets a useless `Split.distribute` tx
          // queued — see issue #86.
          const dust = dustThresholdFor(decimals ?? 18)
          const claimableSplits = splitContracts.filter((s) =>
            splitHasClaimableValue(s, rollupRewardsBySplit, splitBalances, dust),
          )
          return {
            tokenAddress,
            warehouseAddress,
            inputs: claimableSplits.map((s) => ({
              splitContract: s.splitContract,
              providerRewardsRecipient: s.providerRewardsRecipient,
              delegatorBeneficiary: s.delegatorBeneficiary,
              providerTakeRate: s.providerTakeRate,
              providerLabel: s.providerLabel,
              rollupRewardsByRollup: (rollupRewardsBySplit.get(s.splitContract.toLowerCase()) ?? [])
                .filter((r) => r.rewards > 0n)
                .map((r) => ({
                  rollupAddress: r.rollupAddress,
                  rollupVersion: r.rollupVersion ?? "?",
                  rewards: r.rewards,
                })),
              splitContractBalance: splitBalances.get(s.splitContract.toLowerCase()) ?? 0n,
              tokenAddress,
              decimals: decimals ?? 18,
              symbol: symbol ?? "",
            })),
          }
        }}
      />

      <WarehouseSection
        warehouseAddress={warehouseAddress}
        recipients={distinctRecipients}
        balances={warehouseBalances}
        tokenAddress={tokenAddress}
        decimals={decimals ?? 18}
        symbol={symbol ?? ""}
        isLoading={isLoadingChainReads}
      />

      <SplitsList
        splitContracts={splitContracts}
        rollupRewardsBySplit={rollupRewardsBySplit}
        splitBalances={splitBalances}
        warehouseAddress={warehouseAddress}
        tokenAddress={tokenAddress}
        decimals={decimals ?? 18}
        symbol={symbol ?? ""}
        isLoading={isLoadingSplits || isLoadingChainReads}
        hideEmptySplits={hideEmptySplits}
        onToggleHideEmpty={() => setHideEmptySplits((v) => !v)}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

interface IdentitiesSummaryProps {
  address: Address | undefined
  asAdmin: OperatorIdentity[]
  asRecipient: OperatorIdentity[]
  isLoading: boolean
}

function IdentitiesSummary({ address, asAdmin, asRecipient, isLoading }: IdentitiesSummaryProps) {
  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-parchment/5 border border-parchment/20 text-sm text-parchment/60">
        Resolving operator identities…
      </div>
    )
  }
  if (asAdmin.length === 0 && asRecipient.length === 0) {
    return (
      <div className="mb-6 p-4 bg-parchment/5 border border-parchment/20 text-sm">
        <p className="text-parchment/70">
          The connected wallet ({address ? `${address.slice(0, 10)}…${address.slice(-8)}` : "—"}) isn't registered as the admin or rewards recipient for any provider.
        </p>
      </div>
    )
  }
  return (
    <div className="mb-6 p-4 bg-parchment/5 border border-parchment/20">
      <div className="flex flex-wrap gap-3 text-xs">
        {asAdmin.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-parchment/50 uppercase tracking-wide">Admin of</span>
            <span className="font-mono text-parchment">
              {asAdmin.map((i) => `#${i.providerId}`).join(", ")}
            </span>
          </div>
        )}
        {asRecipient.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-parchment/50 uppercase tracking-wide">Rewards recipient for</span>
            <span className="font-mono text-chartreuse">
              {asRecipient.map((i) => `#${i.providerId}`).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface TotalsCardProps {
  totals: { pendingDistribute: bigint; inWarehouse: bigint; total: bigint }
  decimals: number
  symbol: string
  canBatch: boolean
  onAddAll: () =>
    | { tokenAddress: Address; warehouseAddress: Address; inputs: OperatorSplitInputs[] }
    | null
}

function TotalsCard({ totals, decimals, symbol, canBatch, onAddAll }: TotalsCardProps) {
  const { addTransaction, openCart } = useTransactionCart()
  const { showAlert } = useAlert()

  const handleAddAll = () => {
    const payload = onAddAll()
    if (!payload) {
      showAlert("error", "Token or warehouse address unavailable")
      return
    }
    const entries = buildOperatorCommissionEntries({
      splits: payload.inputs,
      warehouseAddress: payload.warehouseAddress,
      tokenAddress: payload.tokenAddress,
    })
    if (entries.length === 0) {
      showAlert("info", "Nothing to claim right now")
      return
    }
    for (const entry of entries) {
      addTransaction(entry, { preventDuplicate: true })
    }
    openCart()
  }

  return (
    <div className="mb-6 p-4 bg-chartreuse/5 border border-chartreuse/30 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-parchment/60 uppercase tracking-wide">
              Total ready to claim
            </span>
            <TooltipIcon
              content="Sum of pending-distribute (operator's share of unclaimed rewards on rollups and split contracts) and the SplitsWarehouse balance owned by this operator's providerRewardsRecipient. If the recipient address is also used by a delegation you participate in, that delegation's commission would be included here as well — the warehouse is keyed by recipient + token, not by role."
              size="sm"
              maxWidth="max-w-md"
            />
          </div>
          <div className="font-mono text-2xl font-bold text-chartreuse">
            {formatTokenAmountFull(totals.total, decimals, symbol)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-parchment/60 uppercase tracking-wide">
              Pending distribute
            </span>
            <TooltipIcon
              content="Operator's share of (unclaimed rollup rewards + ERC20 sitting on split contracts), computed at the configured take rate. These tokens still need a `Split.distribute` call to move into the warehouse."
              size="sm"
              maxWidth="max-w-md"
            />
          </div>
          <div className="font-mono text-lg text-parchment">
            {formatTokenAmountFull(totals.pendingDistribute, decimals, symbol)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-parchment/60 uppercase tracking-wide">
              Already in warehouse
            </span>
            <TooltipIcon
              content="SplitsWarehouse balance owned by this operator's providerRewardsRecipient. Already distributed; a single `withdraw` call sweeps it to the recipient's wallet."
              size="sm"
              maxWidth="max-w-md"
            />
          </div>
          <div className="font-mono text-lg text-parchment">
            {formatTokenAmountFull(totals.inWarehouse, decimals, symbol)}
          </div>
        </div>
      </div>
      <button
        onClick={handleAddAll}
        disabled={!canBatch || totals.total === 0n}
        className="px-4 py-2 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Add all to Batch
      </button>
    </div>
  )
}

interface WarehouseSectionProps {
  warehouseAddress: Address | undefined
  recipients: Address[]
  balances: Map<string, bigint>
  tokenAddress: Address | undefined
  decimals: number
  symbol: string
  isLoading: boolean
}

function WarehouseSection({
  warehouseAddress,
  recipients,
  balances,
  tokenAddress,
  decimals,
  symbol,
  isLoading,
}: WarehouseSectionProps) {
  const { addTransaction, openCart, checkStepGroupInQueue } = useTransactionCart()
  const { showAlert } = useAlert()

  // Only show recipients with a non-zero balance.
  const rows = recipients
    .map((r) => ({ recipient: r, balance: balances.get(r.toLowerCase()) ?? 0n }))
    .filter((r) => r.balance > 0n)

  if (isLoading || rows.length === 0) return null

  const handleWithdraw = (recipient: Address) => {
    if (!tokenAddress || !warehouseAddress) {
      showAlert("error", "Token or warehouse address unavailable")
      return
    }
    // Standalone warehouse withdraw — no upstream distribute to depend on
    // because the balance was distributed previously (likely by a delegator
    // calling their own claim path).
    const entry = buildOperatorWarehouseWithdrawEntry({
      warehouseAddress,
      providerRewardsRecipient: recipient,
      tokenAddress,
      dependsOnDistributeGroups: [],
    })
    addTransaction(entry, { preventDuplicate: true })
    openCart()
  }

  return (
    <div className="mb-6">
      <div className="text-xs text-parchment/40 uppercase tracking-wide mb-2">
        Ready to withdraw from warehouse
      </div>
      <div className="space-y-2">
        {rows.map(({ recipient, balance }) => {
          const isQueued =
            warehouseAddress !== undefined &&
            checkStepGroupInQueue(
              "claim:split-withdraw",
              `operator-warehouse:${warehouseAddress.toLowerCase()}:${recipient.toLowerCase()}`,
            )
          return (
            <div
              key={recipient.toLowerCase()}
              className="p-3 bg-parchment/5 border border-parchment/20 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="min-w-0">
                <div className="text-xs text-parchment/50 mb-0.5">Recipient</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-parchment truncate">
                    {recipient.slice(0, 10)}…{recipient.slice(-8)}
                  </span>
                  <CopyButton text={recipient} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-parchment/60 uppercase tracking-wide mb-0.5">
                    Balance
                  </div>
                  <div className="font-mono text-lg font-bold text-chartreuse">
                    {formatTokenAmountFull(balance, decimals, symbol)}
                  </div>
                </div>
                {isQueued ? (
                  <button
                    onClick={openCart}
                    className="px-3 py-1.5 bg-chartreuse/20 border border-chartreuse/40 text-chartreuse font-oracle-standard text-xs uppercase tracking-wider hover:bg-chartreuse/30 transition-colors flex items-center gap-1"
                  >
                    <Icon name="shoppingCart" size="sm" />
                    In Batch
                  </button>
                ) : (
                  <button
                    onClick={() => handleWithdraw(recipient)}
                    className="px-3 py-1.5 bg-chartreuse text-ink font-oracle-standard text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-colors"
                  >
                    Add Withdraw
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SplitsListProps {
  splitContracts: OperatorSplitContract[]
  rollupRewardsBySplit: Map<string, CoinbaseBreakdown[]>
  splitBalances: Map<string, bigint>
  warehouseAddress: Address | undefined
  tokenAddress: Address | undefined
  decimals: number
  symbol: string
  isLoading: boolean
  hideEmptySplits: boolean
  onToggleHideEmpty: () => void
}

/**
 * Dust threshold for the "Hide empty splits" filter — matches the
 * delegator-claim path's `RECOVERY_DUST_THRESHOLD_NUMERATOR = 5n`. Anything
 * below 0.5 of one whole token renders as "0" in `formatTokenAmountFull`
 * (which uses `Math.round(Number(formatUnits(...)))`), so without this
 * threshold operators see a list of rows that all display zero but pass
 * the strict `> 0n` check.
 */
const DUST_THRESHOLD_NUMERATOR = 5n
function dustThresholdFor(decimals: number): bigint {
  return decimals >= 1 ? DUST_THRESHOLD_NUMERATOR * 10n ** BigInt(decimals - 1) : 0n
}

/**
 * Predicate: this split has at least dust-threshold worth of claimable value
 * (rollup-pending + on-split ERC20). Used by BOTH the visible-list filter
 * and the "Add All to Batch" filter so the two stay in sync.
 *
 * The reason it matters: 0xSplits v2 leaves 1 wei behind after every
 * `distribute`, so any previously-distributed split has a non-zero
 * `splitContractBalance` forever. Without this predicate, "Add All" would
 * queue a `Split.distribute` for every historical split (integer-division
 * → 0 to the operator → wasted gas). The visible list already hides
 * these; the batch builder didn't, producing the 25-visible-vs-174-queued
 * mismatch in issue #86.
 */
function splitHasClaimableValue(
  s: OperatorSplitContract,
  rollupRewardsBySplit: Map<string, CoinbaseBreakdown[]>,
  splitBalances: Map<string, bigint>,
  dust: bigint,
): boolean {
  const rollupTotal = (rollupRewardsBySplit.get(s.splitContract.toLowerCase()) ?? []).reduce(
    (sum, r) => sum + r.rewards,
    0n,
  )
  const onSplit = splitBalances.get(s.splitContract.toLowerCase()) ?? 0n
  return rollupTotal + onSplit >= dust
}

function SplitsList({
  splitContracts,
  rollupRewardsBySplit,
  splitBalances,
  warehouseAddress,
  tokenAddress,
  decimals,
  symbol,
  isLoading,
  hideEmptySplits,
  onToggleHideEmpty,
}: SplitsListProps) {
  // A row counts as "empty" when its pre-distribute pool is below the
  // dust threshold (≈ half a token). Strict `> 0n` would still surface
  // rows with a few wei that render as "0" — that's the bug operators
  // were seeing. Warehouse money is tracked at the recipient level above
  // and doesn't gate per-split visibility here.
  const dust = useMemo(() => dustThresholdFor(decimals), [decimals])
  const visibleSplits = useMemo(() => {
    if (!hideEmptySplits) return splitContracts
    return splitContracts.filter((s) =>
      splitHasClaimableValue(s, rollupRewardsBySplit, splitBalances, dust),
    )
  }, [splitContracts, rollupRewardsBySplit, splitBalances, hideEmptySplits, dust])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="loader" size="md" className="animate-spin text-parchment/60" />
      </div>
    )
  }
  if (splitContracts.length === 0) {
    return (
      <div className="py-12 text-center">
        <Icon name="inbox" size="lg" className="text-parchment/30 mx-auto mb-3" />
        <p className="text-parchment/60 text-sm">No splits found for this operator.</p>
        <p className="text-parchment/40 text-xs mt-1">
          Splits are created when delegators stake to your provider.
        </p>
      </div>
    )
  }

  const hiddenCount = splitContracts.length - visibleSplits.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="text-xs text-parchment/40 uppercase tracking-wide">
          Splits paying you ({visibleSplits.length}
          {hiddenCount > 0 ? ` of ${splitContracts.length}` : ""})
        </div>
        <label className="flex items-center gap-2 text-xs text-parchment/60 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideEmptySplits}
            onChange={onToggleHideEmpty}
            className="accent-chartreuse"
          />
          Hide empty splits
          {hideEmptySplits && hiddenCount > 0 && (
            <span className="text-parchment/40">({hiddenCount} hidden)</span>
          )}
        </label>
      </div>
      {visibleSplits.length === 0 ? (
        <div className="py-8 text-center bg-parchment/5 border border-parchment/20">
          <p className="text-parchment/60 text-sm">All splits are currently empty.</p>
          <p className="text-parchment/40 text-xs mt-1">
            Uncheck "Hide empty splits" to view all {splitContracts.length} historical splits.
          </p>
        </div>
      ) : (
        visibleSplits.map((s) => (
          <SplitRow
            key={`${s.providerId}:${s.splitContract}`}
            split={s}
            rollupRewards={rollupRewardsBySplit.get(s.splitContract.toLowerCase()) ?? []}
            splitContractBalance={splitBalances.get(s.splitContract.toLowerCase()) ?? 0n}
            warehouseAddress={warehouseAddress}
            tokenAddress={tokenAddress}
            decimals={decimals}
            symbol={symbol}
          />
        ))
      )}
    </div>
  )
}

interface SplitRowProps {
  split: OperatorSplitContract
  rollupRewards: CoinbaseBreakdown[]
  splitContractBalance: bigint
  warehouseAddress: Address | undefined
  tokenAddress: Address | undefined
  decimals: number
  symbol: string
}

function SplitRow({
  split,
  rollupRewards,
  splitContractBalance,
  warehouseAddress,
  tokenAddress,
  decimals,
  symbol,
}: SplitRowProps) {
  const { addTransaction, openCart, checkStepGroupInQueue } = useTransactionCart()
  const { showAlert } = useAlert()

  const rollupTotal = rollupRewards.reduce((sum, r) => sum + r.rewards, 0n)
  const preDistribute = rollupTotal + splitContractBalance
  // Pending commission for THIS split only — warehouse balance lives in the
  // recipient-level WarehouseSection above and is intentionally excluded
  // here to avoid double-counting across splits sharing one recipient.
  const pendingCommission = (preDistribute * BigInt(split.providerTakeRate)) / 10000n
  const hasWork = rollupRewards.some((r) => r.rewards > 0n) || splitContractBalance > 0n

  const isQueued = checkStepGroupInQueue(
    "claim:split-distribute",
    `operator-commission:${split.splitContract.toLowerCase()}`,
  )

  const handleAdd = () => {
    if (!tokenAddress || !warehouseAddress) {
      showAlert("error", "Token or warehouse address unavailable")
      return
    }
    const entries = buildOperatorCommissionEntries({
      splits: [
        {
          splitContract: split.splitContract,
          providerRewardsRecipient: split.providerRewardsRecipient,
          delegatorBeneficiary: split.delegatorBeneficiary,
          providerTakeRate: split.providerTakeRate,
          providerLabel: split.providerLabel,
          rollupRewardsByRollup: rollupRewards
            .filter((r) => r.rewards > 0n)
            .map((r) => ({
              rollupAddress: r.rollupAddress,
              rollupVersion: r.rollupVersion ?? "?",
              rewards: r.rewards,
            })),
          splitContractBalance,
          tokenAddress,
          decimals,
          symbol,
        },
      ],
      warehouseAddress,
      tokenAddress,
    })
    if (entries.length === 0) {
      showAlert("info", "Nothing to claim for this split")
      return
    }
    for (const entry of entries) {
      addTransaction(entry, { preventDuplicate: true })
    }
    openCart()
  }

  return (
    <div className="p-4 bg-parchment/5 border border-parchment/20">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-chartreuse/20 text-chartreuse text-xs font-bold uppercase tracking-wide">
              <Icon name="users" size="sm" />
              {split.providerLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ink border border-chartreuse/40 text-chartreuse text-xs font-mono">
              {formatBipsToPercentage(split.providerTakeRate)}% take
            </span>
            <span className="text-xs text-parchment/40 font-mono">#{split.providerId}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm text-parchment truncate">
              {split.splitContract.slice(0, 10)}…{split.splitContract.slice(-8)}
            </span>
            <CopyButton text={split.splitContract} size="sm" />
          </div>
          <div className="text-xs text-parchment/50">
            {split.delegatorBeneficiary ? (
              <>
                Delegator:{" "}
                <span className="font-mono">
                  {split.delegatorBeneficiary.slice(0, 10)}…{split.delegatorBeneficiary.slice(-8)}
                </span>
              </>
            ) : (
              <span className="text-aqua">
                Delegator address not indexed — distribute step skipped, only rollup claim is bundled.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div>
            <div className="text-xs text-parchment/60 uppercase tracking-wide mb-0.5 text-right">
              Pending commission
            </div>
            <div className="font-mono text-lg font-bold text-chartreuse text-right">
              {formatTokenAmountFull(pendingCommission, decimals, symbol)}
            </div>
            <div className="text-xs text-parchment/40 text-right">
              From {formatTokenAmountFull(preDistribute, decimals, symbol)} pre-distribute
            </div>
          </div>
          {isQueued ? (
            <button
              onClick={openCart}
              className="px-3 py-1.5 bg-chartreuse/20 border border-chartreuse/40 text-chartreuse font-oracle-standard text-xs uppercase tracking-wider hover:bg-chartreuse/30 transition-colors flex items-center gap-1"
            >
              <Icon name="shoppingCart" size="sm" />
              In Batch
            </button>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!hasWork}
              className="px-3 py-1.5 bg-chartreuse text-ink font-oracle-standard text-xs uppercase tracking-wider hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add to Batch
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
