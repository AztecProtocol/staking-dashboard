import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { contracts } from "@/contracts"

/**
 * Hook to get comprehensive attester/sequencer information including status, balance, and exit details
 */
export function useAttesterView(attesterAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.rollup.address,
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
