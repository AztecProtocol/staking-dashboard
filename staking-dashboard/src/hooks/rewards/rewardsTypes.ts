import type { Address } from 'viem'

/**
 * Represents the rewards a coinbase address has accumulated on a single rollup.
 *
 * The dashboard fans out reward queries across all known rollups (canonical + historical),
 * so a user with one coinbase address may produce multiple `CoinbaseBreakdown` entries —
 * one per rollup that holds a non-zero balance for that coinbase. The `rollupAddress` /
 * `rollupVersion` fields are how UIs disambiguate the rows and how the claim engine
 * routes each `claimSequencerRewards` call to the correct rollup contract.
 *
 * For backwards compatibility with single-rollup deployments, callers querying only the
 * configured rollup populate `rollupAddress` with `contracts.rollup.address`.
 */
export interface CoinbaseBreakdown {
  address: Address
  rewards: bigint
  source: 'manual'
  /** The rollup contract these rewards live on. */
  rollupAddress: Address
  /** Optional rollup version for display (e.g. "v3"). Resolved from the registry when available. */
  rollupVersion?: bigint
}

/**
 * Represents a manually-added split contract for tracking delegation rewards
 */
export interface ManualSplitBreakdown {
  splitAddress: Address
  rewards: bigint
  userShare: bigint
  providerTakeRate: number
  source: 'manual'
}

/**
 * API response types
 */
export interface CoinbaseAddressResponse {
  coinbaseAddresses: `0x${string}`[]
}

export interface ManualSplitResponse {
  splitAddresses: `0x${string}`[]
}

export interface AddAddressResponse {
  success: boolean
}

export interface RemoveAddressResponse {
  success: boolean
}
