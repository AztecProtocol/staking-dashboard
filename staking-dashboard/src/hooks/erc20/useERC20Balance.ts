import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { ERC20Abi } from "../../contracts/abis/ERC20"

/**
 * Hook to fetch ERC20 token balance for a specific account
 * Uses the complete ERC20Abi
 * @param tokenAddress - The ERC20 token contract address (optional - query disabled if undefined)
 * @param account - The account address to check balance for
 */
export function useERC20Balance(tokenAddress: Address | undefined, account?: Address) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
      staleTime: 30 * 1000, // 30 seconds for balance (more frequent updates)
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  })

  return {
    balance: balance || 0n,
    isLoading,
    refetch,
  }
}