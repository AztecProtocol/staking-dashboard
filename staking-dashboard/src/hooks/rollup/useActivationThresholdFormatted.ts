import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "../../contracts"
import { useStakingAssetTokenDetails } from "../stakingRegistry/useStakingAssetTokenDetails"
import { formatTokenAmount } from "@/utils/atpFormatters"

/**
 * Hook to get formatted activation threshold with token details.
 *
 * @param rollupAddress - Optional rollup contract to query. Defaults to the configured rollup.
 */
export function useActivationThresholdFormatted(rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const { data: activationThreshold, isLoading: isLoadingThreshold, error: thresholdError } = useReadContract({
    abi: contracts.rollup.abi,
    address: targetRollup,
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
