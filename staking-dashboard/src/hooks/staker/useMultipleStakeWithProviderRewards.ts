import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { ERC20Abi } from '@/contracts/abis/ERC20'
import { calculateTotalUserShareFromSplitRewards } from '@/utils/rewardCalculations'
import { useFeeAssetTokenDetails } from '@/hooks/rollup'
import { contracts, getRollupVersions, type RollupVersion } from '@/contracts'
import type { Delegation } from '@/hooks/atp'
import type { StakeWithProviderReward } from './types'

interface MultipleStakeWithProviderRewardsParams {
  delegations: Delegation[]
  enabled?: boolean
}

/**
 * Hook to calculate rewards for multiple delegations (stakeWithProvider method).
 *
 * Fans `getSequencerRewards(splitContract)` out across every rollup version the
 * Registry has indexed so balances on old rollups still show up in totals and
 * drive the per-rollup claim fan-out. Also queries each split contract's ERC20
 * balance for the post-claim distribute calc.
 *
 * Layout of the multicall, per delegation (stride = rollups.length + 1):
 *   [getSequencerRewards@r1, getSequencerRewards@r2, ..., balanceOf(split)]
 */
export const useMultipleStakeWithProviderRewards = ({
  delegations,
  enabled = true
}: MultipleStakeWithProviderRewardsParams) => {
  const { feeAssetAddress: tokenAddress } = useFeeAssetTokenDetails()

  // Rollups enumerated oldest first. Raw version ids are uint256s; we replace
  // them with 1-based ordinals ("v1", "v2", …) for display.
  const rollups = useMemo<Array<{ address: Address; version: string }>>(() => {
    const versions = getRollupVersions()
    if (versions.length > 0) {
      return versions.map((v: RollupVersion, i) => ({
        address: v.address,
        version: String(i + 1),
      }))
    }
    return [{ address: contracts.rollup.address, version: '?' }]
  }, [])

  // Multicall size grows as `delegations.length * (rollups.length + 1)`. With
  // the current mainnet shape (2 rollups, single-digit delegations per user)
  // this is tiny. If the Registry adds many more rollups, or a user holds
  // dozens of delegations, consider chunking or adding an `enabled` gate per
  // delegation so we don't refetch the entire matrix on every action.
  const callsPerDelegation = rollups.length + 1
  const rewardContracts = tokenAddress && delegations.length > 0
    ? delegations.flatMap((delegation) => [
        ...rollups.map((r) => ({
          address: r.address,
          abi: contracts.rollup.abi,
          functionName: 'getSequencerRewards',
          args: [delegation.splitContract as Address],
        })),
        {
          address: tokenAddress as Address,
          abi: ERC20Abi,
          functionName: 'balanceOf',
          args: [delegation.splitContract as Address],
        },
      ])
    : []

  const { data: rewardData, isLoading, error, refetch } = useReadContracts({
    contracts: rewardContracts,
    query: {
      enabled: !!tokenAddress && delegations.length > 0 && enabled,
    },
  })

  const delegationRewards: StakeWithProviderReward[] = delegations.map((delegation, dIdx) => {
    const baseIndex = dIdx * callsPerDelegation
    const rollupRewardsByRollup = rollups.map((r, rIdx) => {
      const result = rewardData?.[baseIndex + rIdx]
      const rewards = (result?.result as bigint | undefined) ?? 0n
      return {
        rollupAddress: r.address,
        rollupVersion: r.version,
        rewards,
      }
    })
    const rollupRewardsTotal = rollupRewardsByRollup.reduce((sum, r) => sum + r.rewards, 0n)
    const splitBalance = (rewardData?.[baseIndex + rollups.length]?.result as bigint | undefined) ?? 0n

    const totalRewards = rollupRewardsTotal + splitBalance
    const userRewards = calculateTotalUserShareFromSplitRewards(
      rollupRewardsTotal,
      splitBalance,
      0n, // warehouse balance — omitted; surfaced separately via useWarehouseBalance
      delegation.providerTakeRate,
    )

    return {
      providerId: delegation.providerId,
      splitContract: delegation.splitContract,
      totalRewards,
      userRewards,
      takeRate: delegation.providerTakeRate,
      rollupRewardsByRollup,
      splitContractBalance: splitBalance,
    }
  })

  const totalUserRewards = delegationRewards.reduce(
    (sum, delegation) => sum + delegation.userRewards,
    0n,
  )

  return {
    delegationRewards,
    totalUserRewards,
    isLoading,
    error,
    isSuccess: !!rewardData,
    refetch,
  }
}
