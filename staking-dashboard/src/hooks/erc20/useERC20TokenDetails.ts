import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { ERC20Abi } from "../../contracts/abis/ERC20"

/**
 * Hook to fetch all ERC20 token details at once
 * Uses useReadContracts for efficient batch fetching with the complete ERC20Abi
 * Wagmi handles caching automatically
 * @param tokenAddress - The ERC20 token contract address
 */
export function useERC20TokenDetails(tokenAddress: Address) {
  // Batch read all token details at once using the complete ERC20Abi
  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "symbol",
      },
      {
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "decimals",
      },
      {
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "totalSupply",
      },
    ],
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    }
  })

  // Parse the batch results
  const nameData = data?.[0]?.result as string | undefined
  const symbolData = data?.[1]?.result as string | undefined
  const decimalsData = data?.[2]?.result as number | undefined
  const totalSupplyData = data?.[3]?.result as bigint | undefined

  // Build token details object
  const tokenDetails = nameData && symbolData && decimalsData !== undefined && totalSupplyData
    ? {
        name: nameData,
        symbol: symbolData,
        decimals: decimalsData,
        totalSupply: totalSupplyData,
      }
    : null

  return {
    tokenDetails,
    isLoading,
    name: tokenDetails?.name,
    symbol: tokenDetails?.symbol,
    decimals: tokenDetails?.decimals,
    totalSupply: tokenDetails?.totalSupply,
  }
}