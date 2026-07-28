import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Hook to check if rewards are claimable from a specific rollup contract.
 *
 * `isRewardsClaimable()` was a network-wide reward lock on older rollups; a
 * `false` return means the protocol has frozen claims. The V5 rollup removed
 * the function, so the call reverts there — but claims on V5 are always live.
 * We fail OPEN: `isRewardsClaimable` is `false` only when the rollup explicitly
 * returns `false`; a revert (function absent, e.g. V5) or a still-loading read
 * reads as `true`, so a removed view can't silently disable claims or surface a
 * spurious "rewards locked" banner. See issue #111.
 *
 * @param rollupAddress - Optional rollup contract to query. Defaults to the configured rollup.
 */
export function useIsRewardsClaimable(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const query = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
    functionName: "isRewardsClaimable"
  })

  return {
    isRewardsClaimable: query.data !== false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}
