import { useReadContract } from "wagmi"
import { type Address } from "viem"
import { SplitAbi } from "@/contracts/abis/Split"

/**
 * Hook to read the split hash from a Split contract
 */
export const useSplitHash = (splitContractAddress: Address | undefined) => {
  const { data, isLoading, error } = useReadContract({
    address: splitContractAddress,
    abi: SplitAbi,
    functionName: "splitHash",
    query: {
      enabled: !!splitContractAddress,
    },
  })

  return {
    splitHash: data as `0x${string}` | undefined,
    isLoading,
    error,
  }
}
