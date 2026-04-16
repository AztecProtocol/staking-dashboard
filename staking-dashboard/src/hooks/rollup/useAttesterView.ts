import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Hook to get comprehensive attester/sequencer information including status, balance, and exit details.
 *
 * @param attesterAddress - The attester address to query
 * @param rollupAddress   - Optional rollup contract to query. Defaults to the configured rollup.
 *                          An attester active on rollup v3 but not v4 will appear with status NONE
 *                          on the canonical rollup — pass the specific rollup address to detect
 *                          stranded stakes on older rollups.
 */
export function useAttesterView(attesterAddress: Address | undefined, rollupAddress?: Address) {
  const targetRollup = rollupAddress ?? contracts.rollup.address
  const { data, isLoading, error, refetch } = useReadContract({
    address: targetRollup,
    abi: contracts.rollup.abi,
    functionName: "getAttesterView",
    args: attesterAddress ? [attesterAddress] : undefined,
    query: {
      enabled: !!attesterAddress,
    },
  })

  return {
    attesterView: data,
    status: data?.status,
    effectiveBalance: data?.effectiveBalance,
    exit: data?.exit,
    config: data?.config,
    isLoading,
    error,
    refetch,
  }
}
