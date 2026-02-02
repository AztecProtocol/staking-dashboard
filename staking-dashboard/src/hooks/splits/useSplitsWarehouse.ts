import { useReadContract } from "wagmi"
import { type Address } from "viem"
import { SplitAbi } from "@/contracts/abis/Split"

/**
 * Hook to read the SplitsWarehouse address from a Split contract
 */
export const useSplitsWarehouse = (splitContractAddress: Address | undefined) => {
  const { data, isLoading, error } = useReadContract({
    address: splitContractAddress,
    abi: SplitAbi,
    functionName: "SPLITS_WAREHOUSE",
    query: {
      enabled: !!splitContractAddress,
    },
  })

  return {
    warehouseAddress: data as Address | undefined,
    isLoading,
    error,
  }
}
