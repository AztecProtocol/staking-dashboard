import { useReadContract } from "wagmi"
import { useERC20TokenDetails } from "../erc20/useERC20TokenDetails"
import { contracts } from "../../contracts"
import type { Address } from "viem"

/**
 * Hook to get the staking asset token details from the StakingRegistry
 * First fetches the staking asset address, then gets the token details
 */
export function useStakingAssetTokenDetails() {
  // Get the staking asset address from StakingRegistry
  const { data: stakingAssetAddress, isLoading: isLoadingAddress, error: addressError } = useReadContract({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "STAKING_ASSET",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  // Get token details for the staking asset
  const {
    tokenDetails,
    isLoading: isLoadingTokenDetails,
    name,
    symbol,
    decimals,
    totalSupply
  } = useERC20TokenDetails(stakingAssetAddress as Address)

  return {
    // Staking asset address
    stakingAssetAddress: stakingAssetAddress as Address | undefined,

    // Token details
    tokenDetails,
    name,
    symbol,
    decimals,
    totalSupply,

    // Loading states
    isLoading: isLoadingAddress || isLoadingTokenDetails,
    isLoadingAddress,
    isLoadingTokenDetails,

    // Error handling
    error: addressError,
  }
}