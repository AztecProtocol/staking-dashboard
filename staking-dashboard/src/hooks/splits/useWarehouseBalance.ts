import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { SplitWarehouseAbi } from "@/contracts/abis/SplitWarehouse"

/**
 * Hook to get warehouse balance for detecting unwithdrawned distributed rewards
 * Uses warehouse's balanceOf(address owner, uint256 id) function
 */
export const useWarehouseBalance = (
  warehouseAddress: Address | undefined,
  userAddress: Address | undefined,
  tokenAddress: Address | undefined
) => {
  const tokenId = tokenAddress ? BigInt(tokenAddress) : undefined

  const { data, isLoading, error, refetch } = useReadContract({
    address: warehouseAddress,
    abi: SplitWarehouseAbi,
    functionName: "balanceOf",
    args: userAddress && tokenId !== undefined ? [userAddress, tokenId] : undefined,
    query: {
      enabled: !!warehouseAddress && !!userAddress && tokenId !== undefined,
    },
  })

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}
