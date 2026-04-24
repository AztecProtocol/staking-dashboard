import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Hook to get comprehensive attester/sequencer information including status, balance, and exit details.
 *
 * `rollupAddress` is required (but may be undefined while the caller's data is still
 * loading). A legacy-rollup stake queried against the current canonical rollup returns
 * status=NONE and strands users in "IN QUEUE" with no finalize button — so there is
 * deliberately no silent fallback to `contracts.rollup.address`.
 */
export function useAttesterView(
  attesterAddress: Address | undefined,
  rollupAddress: Address | undefined,
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: rollupAddress,
    abi: contracts.rollup.abi,
    functionName: "getAttesterView",
    args: attesterAddress ? [attesterAddress] : undefined,
    query: {
      enabled: !!attesterAddress && !!rollupAddress,
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
