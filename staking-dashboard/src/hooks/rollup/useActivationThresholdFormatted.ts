import { useReadContract } from "wagmi"
import { contracts } from "../../contracts"
import { useStakingAssetTokenDetails } from "../stakingRegistry/useStakingAssetTokenDetails"
import { formatTokenAmount } from "@/utils/atpFormatters"

/**
 * Hook to get formatted activation threshold with token details
 * Fetches activation threshold directly from rollup contract and formats with staking asset token details
 */
export function useActivationThresholdFormatted() {
  const { data: activationThreshold, isLoading: isLoadingThreshold, error: thresholdError } = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
    functionName: "getActivationThreshold",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  const { decimals, symbol, isLoading: isLoadingToken, error: tokenError } = useStakingAssetTokenDetails()

  const formattedThreshold = formatTokenAmount(activationThreshold as bigint | undefined, decimals, symbol)

  return {
    activationThreshold: activationThreshold as bigint | undefined,
    formattedThreshold,
    decimals,
    symbol,
    isLoading: isLoadingThreshold || isLoadingToken,
    error: thresholdError || tokenError,
  }
}
