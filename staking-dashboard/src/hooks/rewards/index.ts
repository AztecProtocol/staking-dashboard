// Types
export * from "./rewardsTypes"

// Coinbase address hooks
export { useCoinbaseAddresses } from "./useCoinbaseAddresses"
export { useAddCoinbaseAddress } from "./useAddCoinbaseAddress"
export { useRemoveCoinbaseAddress } from "./useRemoveCoinbaseAddress"
export { useMultipleCoinbaseRewards } from "./useMultipleCoinbaseRewards"
export { useClaimCoinbaseRewards } from "./useClaimCoinbaseRewards"

// Manual split address hooks
export { useManualSplitAddresses } from "./useManualSplitAddresses"
export { useAddManualSplit } from "./useAddManualSplit"
export { useRemoveManualSplit } from "./useRemoveManualSplit"

// Claim all rewards
export { useClaimAllRewards } from "./useClaimAllRewards"
export type { ClaimTask, ClaimTaskStatus, ClaimTaskType } from "./useClaimAllRewards"
