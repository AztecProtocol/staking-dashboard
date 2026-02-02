import { useReadContracts } from 'wagmi'
import { ERC20Abi } from '@/contracts/abis/ERC20'
import { calculateUserShareFromTakeRate } from '@/utils/rewardCalculations'
import { useStakingAssetTokenDetails } from '@/hooks/stakingRegistry'
import type { Delegation } from '@/hooks/atp'
import type { StakeWithProviderReward } from './types'

interface MultipleStakeWithProviderRewardsParams {
  delegations: Delegation[]
  enabled?: boolean
}

/**
 * Hook to calculate rewards for multiple delegations (stakeWithProvider method)
 *
 * Reward Calculation Logic:
 * 1. Get total rewards for each: totalRewards = stakingToken.balanceOf(splitContract)
 * 2. Apply user's share: userRewards = totalRewards * (10000 - providerTakeRate) / 10000
 */
export const useMultipleStakeWithProviderRewards = ({
  delegations,
  enabled = true
}: MultipleStakeWithProviderRewardsParams) => {
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Build contracts array for all split contract balance queries
  const balanceContracts = tokenAddress && delegations.length > 0
    ? delegations.map(delegation => ({
      address: tokenAddress as `0x${string}`,
      abi: ERC20Abi,
      functionName: 'balanceOf',
      args: [delegation.splitContract as `0x${string}`],
    }))
    : []

  // Get balances for all split contracts
  const { data: balancesData, isLoading, error, refetch } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!tokenAddress && delegations.length > 0 && enabled,
    },
  })

  // Calculate user rewards for each delegation
  const delegationRewards: StakeWithProviderReward[] = delegations.map((delegation, index) => {
    const totalRewards = (balancesData?.[index]?.result as bigint) || 0n
    const userRewards = calculateUserShareFromTakeRate(totalRewards, delegation.providerTakeRate)

    return {
      providerId: delegation.providerId,
      splitContract: delegation.splitContract,
      totalRewards,
      userRewards,
      takeRate: delegation.providerTakeRate
    }
  })

  // Calculate total user rewards across all delegations
  const totalUserRewards = delegationRewards.reduce((sum, delegation) => sum + delegation.userRewards, 0n)

  return {
    delegationRewards,
    totalUserRewards,
    isLoading,
    error,
    isSuccess: !!balancesData,
    refetch
  }
}
