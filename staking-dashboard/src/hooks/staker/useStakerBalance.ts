import { useReadContracts } from 'wagmi'
import { ERC20Abi } from '@/contracts/abis/ERC20'
import { useStakingAssetTokenDetails } from '@/hooks/stakingRegistry'
import type { Address } from 'viem'

interface StakerBalanceParams {
  stakerAddress?: Address
  enabled?: boolean
}

/**
 * Hook to get the token balance of the staker contract
 */
export const useStakerBalance = ({ stakerAddress, enabled = true }: StakerBalanceParams) => {
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  const { data: balanceData, isLoading, error, refetch } = useReadContracts({
    contracts: tokenAddress && stakerAddress ? [
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [stakerAddress],
      },
    ] : [],
    query: {
      enabled: !!tokenAddress && !!stakerAddress && enabled,
      staleTime: 60_000,
      gcTime: Infinity
    },
  })

  const balance = balanceData?.[0]?.result as bigint | undefined

  return {
    balance: balance || 0n,
    isLoading,
    error,
    isSuccess: !!balance,
    refetch
  }
}
