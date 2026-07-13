import { useReadContract } from "wagmi"
import { useERC20TokenDetails } from "../erc20/useERC20TokenDetails"
import { contracts } from "../../contracts"
import type { Address } from "viem"

/**
 * Hook to get the fee asset token details from the canonical rollup.
 *
 * Sequencer rewards are denominated in the rollup's FEE asset
 * (`Rollup.getFeeAsset()`), NOT the staking asset. On mainnet the two are the
 * same token, but on testnet they differ — using the staking asset in the
 * claim pipeline made `Split.distribute()` distribute a zero balance while
 * the actual fee-asset rewards sat stranded on the split contract. Any code
 * that reads, distributes, or withdraws sequencer rewards must use this hook
 * rather than `useStakingAssetTokenDetails`.
 */
export function useFeeAssetTokenDetails() {
  const { data: feeAssetAddress, isLoading: isLoadingAddress, error: addressError } = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
    functionName: "getFeeAsset",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  const {
    tokenDetails,
    isLoading: isLoadingTokenDetails,
    name,
    symbol,
    decimals,
    totalSupply
  } = useERC20TokenDetails(feeAssetAddress as Address)

  return {
    // Fee asset address (reward token)
    feeAssetAddress: feeAssetAddress as Address | undefined,

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
