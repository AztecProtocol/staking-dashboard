import { useReadContracts } from 'wagmi'
import { ATPWithdrawableAndClaimableStakerAbi } from '@/contracts/abis/ATPWithdrawableAndClaimableStaker'
import type { Address } from 'viem'

interface NCStakerStatusParams {
  stakerAddress?: Address
  enabled?: boolean
  /** Optional block timestamp to use instead of Date.now() for withdrawal eligibility check */
  blockTimestamp?: bigint
}

/**
 * Hook to check NCATP staker status
 * Returns hasStaked status and withdrawal timestamp
 *
 * @param blockTimestamp - If provided, uses blockchain time instead of Date.now()
 *                         for checking withdrawal eligibility
 */
export const useNCStakerStatus = ({ stakerAddress, enabled = true, blockTimestamp }: NCStakerStatusParams) => {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: stakerAddress ? [
      {
        address: stakerAddress,
        abi: ATPWithdrawableAndClaimableStakerAbi,
        functionName: 'hasStaked',
      },
      {
        address: stakerAddress,
        abi: ATPWithdrawableAndClaimableStakerAbi,
        functionName: 'WITHDRAWAL_TIMESTAMP',
      },
    ] : [],
    query: {
      enabled: !!stakerAddress && enabled,
      staleTime: 60_000,
      gcTime: Infinity
    },
  })

  const hasStaked = data?.[0]?.result as boolean | undefined
  const withdrawalTimestamp = data?.[1]?.result as bigint | undefined

  // Check if current time is past withdrawal timestamp
  // Use blockTimestamp if provided (for accurate on-chain validation), otherwise fall back to Date.now()
  const currentTime = blockTimestamp ?? BigInt(Math.floor(Date.now() / 1000))
  const canWithdraw = withdrawalTimestamp ? currentTime >= withdrawalTimestamp : false

  return {
    hasStaked: hasStaked ?? false,
    withdrawalTimestamp,
    canWithdraw,
    isLoading,
    error,
    refetch
  }
}
