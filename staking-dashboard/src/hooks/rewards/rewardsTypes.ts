import type { Address } from 'viem'

/**
 * Represents a coinbase address saved by the user for tracking self-stake rewards
 */
export interface CoinbaseBreakdown {
  address: Address
  rewards: bigint
  source: 'manual'
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
