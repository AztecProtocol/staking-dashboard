import { encodeFunctionData, type Address } from "viem"
import {
  ClaimStepType,
  type ClaimMetadata,
  type RawTransaction,
  type TransactionDependency,
} from "@/contexts/TransactionCartContextType"
import type { CartTransaction } from "@/contexts/TransactionCartContext"
import { buildDistributeRewardsTx } from "@/hooks/splits/useDistributeRewards"
import { buildWithdrawRewardsTx } from "@/hooks/splits/useWithdrawRewards"
import { contracts } from "@/contracts"
import { formatTokenAmountFull } from "./atpFormatters"

/**
 * Build a `claimSequencerRewards(coinbase)` raw transaction. Used for both
 * direct coinbase claims and split-contract claims (pass the split contract
 * as `coinbaseAddress`). Kept here next to the other claim-cart builders so
 * the whole "cart entry construction" lives in one file.
 */
export function buildClaimSequencerRewardsTx(
  coinbaseAddress: Address,
  rollupAddress: Address,
): RawTransaction {
  return {
    to: rollupAddress,
    data: encodeFunctionData({
      abi: contracts.rollup.abi,
      functionName: "claimSequencerRewards",
      args: [coinbaseAddress],
    }),
    value: 0n,
  }
}

/**
 * The shape `addTransaction()` expects for a claim entry. Used by each of the
 * three claim entry points so they produce identical cart entries given the
 * same inputs.
 */
export type ClaimCartEntry = Omit<Extract<CartTransaction, { type: "claim" }>, "id">

export interface DelegationClaimInputs {
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  /** Display name used in the cart entry's description. */
  providerLabel: string
  /** Per-rollup unclaimed `getSequencerRewards(splitContract)` balances. */
  rollupRewardsByRollup: Array<{ rollupAddress: Address; rollupVersion: string; rewards: bigint }>
  /** The connected wallet receiving the user's share. */
  beneficiary: Address
  /** Reward token (fee asset). */
  tokenAddress: Address
  decimals: number
  symbol: string
  /** Current ERC20 balance sitting on the split contract. When non-zero with
   *  no per-rollup balance to claim, the helper emits a distribute-only entry
   *  to sweep stranded tokens — but only if the balance is above
   *  `RECOVERY_DUST_THRESHOLD_NUMERATOR / 10` of one whole token, to avoid
   *  queuing a useless distribute for the rounding-dust most splits carry
   *  after any partial distribute. */
  splitContractBalance?: bigint
}

/**
 * Dust threshold (numerator / 10) used to gate the distribute-only recovery
 * flow. `5` here means "0.5 of a whole token". Below this we assume the
 * leftover is rounding-dust and not worth queuing a transaction for.
 */
const RECOVERY_DUST_THRESHOLD_NUMERATOR = 5n

/**
 * Returns the dust threshold for a token of the given decimals — half of
 * one whole token, scaled. Exposed so callers that pre-filter delegations
 * (e.g., bulk-claim buttons surfacing a count) can use the same gate as
 * `buildDelegationClaimEntries` does internally, keeping the "Add All (N)"
 * label honest about what will actually be queued.
 */
export function getRecoveryDustThreshold(decimals: number): bigint {
  return decimals >= 1 ? RECOVERY_DUST_THRESHOLD_NUMERATOR * 10n ** BigInt(decimals - 1) : 0n
}

/**
 * Pick a split contract to resolve the SplitsWarehouse address from.
 *
 * Every split funnels into the same warehouse for a given token, so any one of
 * the user's splits answers the question. The lists are tried in order, which
 * matters because a delegator who stakes only from a wallet has no ATP
 * delegations: reading just the first list left the address undefined and
 * silently disabled every warehouse read and withdraw for them.
 */
export function resolveWarehouseSplit(
  ...delegationLists: Array<ReadonlyArray<{ splitContract?: string }> | undefined>
): Address | undefined {
  for (const list of delegationLists) {
    const found = list?.find((d) => d?.splitContract)?.splitContract
    if (found) return found as Address
  }
  return undefined
}

export interface DelegationClaimResult {
  entries: ClaimCartEntry[]
  /** `stepGroupIdentifier` of the delegation's distribute step. Pass to
   *  `buildWarehouseWithdrawEntry` so the warehouse withdraw can depend on
   *  this delegation's distribute. Null when nothing was produced. */
  distributeGroup: string | null
}

/**
 * One delegation's claim leg: one `claimSequencerRewards` entry per rollup
 * with a non-zero balance, then distribute. Withdraw is intentionally NOT
 * included — the caller adds a single warehouse withdraw at the end of the
 * batch via `buildWarehouseWithdrawEntry`, since the warehouse is per-(user,
 * token) and one withdraw drains everything.
 */
export function buildDelegationClaimEntries(inputs: DelegationClaimInputs): DelegationClaimResult {
  const {
    splitContract,
    providerTakeRate,
    providerRewardsRecipient,
    providerLabel,
    rollupRewardsByRollup,
    beneficiary,
    tokenAddress,
    decimals,
    symbol,
    splitContractBalance = 0n,
  } = inputs

  const claimables = rollupRewardsByRollup.filter((r) => r.rewards > 0n)
  // Dust threshold scaled by the asset's decimals (0.5 of one whole token).
  // Splits almost always carry a tiny non-zero balance after a partial
  // distribute, so a bare `splitContractBalance > 0n` check made the bulk
  // path queue a useless distribute every click. Only treat balances above
  // the threshold as a real stranded amount worth a distribute-only recovery.
  const dustThreshold = getRecoveryDustThreshold(decimals)
  if (claimables.length === 0 && splitContractBalance < dustThreshold) {
    return { entries: [], distributeGroup: null }
  }

  const stepGroup = `delegation:${splitContract.toLowerCase()}`
  const entries: ClaimCartEntry[] = []

  // One claim per rollup with balance. No distinction between canonical and
  // non-canonical — they're all `claimSequencerRewards()` calls that move
  // tokens from a rollup into the split contract.
  // Per-claim stepGroupIdentifier is suffixed with the rollup address so each
  // (delegation × rollup) claim is uniquely addressable. distribute below then
  // declares a dependency on every single one. Without uniqueness, the cart's
  // dependency resolver (`Array.find`) would only see the first claim and let
  // the user move distribute past the rest — stranding tokens on the
  // un-claimed rollups.
  //
  // The address is the unconditionally-unique identity. `rollupVersion` is
  // display-only — callers normalise missing versions to placeholders like
  // "?", which would collide here if we used it as the discriminator.
  const claimGroupFor = (r: { rollupAddress: Address }) =>
    `${stepGroup}:${r.rollupAddress.toLowerCase()}`
  for (const r of claimables) {
    const metadata: ClaimMetadata = {
      stepType: ClaimStepType.SplitClaim,
      stepGroupIdentifier: claimGroupFor(r),
      splitContract,
      rollupAddress: r.rollupAddress,
      rollupVersion: r.rollupVersion,
      amount: r.rewards,
    }
    entries.push({
      type: "claim",
      label: `Claim — Rollup v${r.rollupVersion}`,
      description: `${formatTokenAmountFull(r.rewards, decimals, symbol)} for ${providerLabel}`,
      transaction: buildClaimSequencerRewardsTx(splitContract, r.rollupAddress),
      metadata,
    })
  }

  // Distribute splits the split contract's balance between provider and user.
  const totalAllocation = 10000n
  const providerAllocation = BigInt(providerTakeRate)
  const userAllocation = totalAllocation - providerAllocation
  const splitData = {
    recipients: [providerRewardsRecipient, beneficiary],
    allocations: [providerAllocation, userAllocation],
    totalAllocation,
    distributionIncentive: 0,
  }
  const distributeDependsOn: TransactionDependency<ClaimStepType>[] = claimables.map((r) => ({
    stepType: ClaimStepType.SplitClaim,
    stepGroupIdentifier: claimGroupFor(r),
  }))
  entries.push({
    type: "claim",
    label: `Distribute — ${providerLabel}`,
    description: `Split between you and the provider`,
    transaction: buildDistributeRewardsTx(splitContract, splitData, tokenAddress, beneficiary),
    metadata: {
      stepType: ClaimStepType.SplitDistribute,
      stepGroupIdentifier: stepGroup,
      splitContract,
      tokenAddress,
      dependsOn: distributeDependsOn,
    },
  })

  return { entries, distributeGroup: stepGroup }
}

export interface CoinbaseClaimInputs {
  coinbase: Address
  rollupAddress: Address
  rollupVersion?: string
  rewards: bigint
  decimals: number
  symbol: string
}

/** A single coinbase reward claim. No dependencies; each is independent. */
export function buildCoinbaseClaimEntry(inputs: CoinbaseClaimInputs): ClaimCartEntry {
  const { coinbase, rollupAddress, rollupVersion, rewards, decimals, symbol } = inputs
  return {
    type: "claim",
    label: `Claim — Rollup v${rollupVersion ?? "?"}`,
    description: `${formatTokenAmountFull(rewards, decimals, symbol)} for ${coinbase.slice(0, 10)}…${coinbase.slice(-8)}`,
    transaction: buildClaimSequencerRewardsTx(coinbase, rollupAddress),
    metadata: {
      stepType: ClaimStepType.CoinbaseClaim,
      stepGroupIdentifier: `coinbase:${coinbase.toLowerCase()}:${rollupAddress.toLowerCase()}`,
      coinbase,
      rollupAddress,
      rollupVersion,
      amount: rewards,
    },
  }
}

export interface WarehouseWithdrawInputs {
  warehouseAddress: Address
  beneficiary: Address
  tokenAddress: Address
  /** `stepGroupIdentifier` of the latest delegation's distribute step (from
   *  `DelegationClaimResult.distributeGroup`). Null if no distributes are
   *  upstream — the withdraw becomes standalone (e.g., for a pre-distributed
   *  pending warehouse balance). */
  dependsOnDistributeGroup: string | null
}

/**
 * A single warehouse withdraw that drains the user's accumulated balance for
 * the given token. One per batch (warehouse is per-(user, token), and the
 * cart deduplicates by tx signature anyway).
 */
export function buildWarehouseWithdrawEntry(inputs: WarehouseWithdrawInputs): ClaimCartEntry {
  const { warehouseAddress, beneficiary, tokenAddress, dependsOnDistributeGroup } = inputs
  const dependsOn: TransactionDependency<ClaimStepType>[] = dependsOnDistributeGroup
    ? [{ stepType: ClaimStepType.SplitDistribute, stepGroupIdentifier: dependsOnDistributeGroup }]
    : []
  return {
    type: "claim",
    label: "Withdraw rewards from warehouse",
    description: "Transfer your accumulated balance to your wallet",
    transaction: buildWithdrawRewardsTx(warehouseAddress, beneficiary, tokenAddress),
    metadata: {
      stepType: ClaimStepType.SplitWithdraw,
      stepGroupIdentifier: `warehouse:${warehouseAddress.toLowerCase()}`,
      warehouseAddress,
      tokenAddress,
      dependsOn: dependsOn.length ? dependsOn : undefined,
    },
  }
}
