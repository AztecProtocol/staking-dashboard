import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Hook to get comprehensive attester/sequencer information including status, balance, and exit details
 */
export function useAttesterView(
  attesterAddress: Address | undefined,
  rollupAddress?: Address,
) {
  // Delegations on a legacy rollup must be queried against their own rollup,
  // not the current canonical one, or getAttesterView returns status=NONE and
  // the UI strands the user in "IN QUEUE" with no finalize button.
  const address = rollupAddress ?? contracts.rollup.address
  const { data, isLoading, error, refetch } = useReadContract({
    address,
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
