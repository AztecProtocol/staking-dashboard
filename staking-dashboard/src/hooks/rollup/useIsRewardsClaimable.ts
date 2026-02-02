import { useReadContract } from "wagmi"
import { contracts } from "@/contracts"

/**
 * Hook to check if rewards are claimable from the rollup contract
 */
export function useIsRewardsClaimable() {
  const query = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
    functionName: "isRewardsClaimable"
  })

  return {
    isRewardsClaimable: query.data as boolean | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}
