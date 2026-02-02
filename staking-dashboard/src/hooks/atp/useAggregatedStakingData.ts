import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useReadContracts, useReadContract, useAccount } from 'wagmi'
import { config } from '@/config'
import { ERC20Abi } from '@/contracts/abis/ERC20'
import { SplitAbi } from '@/contracts/abis/Split'
import { SplitWarehouseAbi } from '@/contracts/abis/SplitWarehouse'
import { calculateTotalUserShareFromSplitRewards } from '@/utils/rewardCalculations'
import { useStakingAssetTokenDetails } from '@/hooks/stakingRegistry'
import { contracts } from '@/contracts'
import type { Address } from 'viem'
import { stringToBigInt } from '@/utils/atpFormatters'
import type { StakeStatus } from './atpTypes'
import {
  getPendingDirectStakes,
  removePendingDirectStakes,
  cleanupStalePendingStakes,
} from '@/utils/pendingDirectStakes'

export interface DirectStakeBreakdown {
  atpAddress: Address
  attesterAddress: Address
  stakedAmount: bigint
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number

  // To include the provider's self-stake as my stake in a given provider
  providerId?: number
  providerName?: string
  providerLogo?: string
}

export interface DelegationBreakdown {
  atpAddress: Address
  providerId: number
  providerName?: string
  providerLogo?: string
  attesterAddress: Address
  stakedAmount: bigint
  rewards: bigint
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number
}

export interface Erc20DelegationBreakdown {
  providerId: number
  providerName?: string
  providerLogo?: string
  attesterAddress: Address
  stakedAmount: bigint
  rewards: bigint
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number
}

export interface Erc20DirectStakeBreakdown {
  attesterAddress: Address
  withdrawerAddress: Address
  stakedAmount: bigint
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number
}

export interface AggregatedStakingData {
  totalStaked: bigint
  totalDirectStaked: bigint
  totalDelegated: bigint
  totalErc20Staked: bigint
  totalErc20Delegated: bigint
  totalErc20DirectStaked: bigint
  totalRewards: bigint
  totalDelegationRewards: bigint
  /** Tokens distributed to warehouse but not yet withdrawn by user */
  pendingWarehouseWithdrawal: bigint
  directStakeBreakdown: DirectStakeBreakdown[]
  delegationBreakdown: DelegationBreakdown[]
  erc20DelegationBreakdown: Erc20DelegationBreakdown[]
  erc20DirectStakeBreakdown: Erc20DirectStakeBreakdown[]
  isLoading: boolean
  refetch: () => void
}

interface ApiDirectStake {
  atpAddress: string
  attesterAddress: string
  stakedAmount: string
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number

  // To include the provider's self-stake as my stake in a given provider
  providerId?: number
  providerName?: string
  providerLogo?: string
}

interface ApiDelegation {
  atpAddress: string
  providerId: number
  providerName?: string
  providerLogo?: string
  attesterAddress: string
  stakedAmount: string
  splitContract: string
  providerTakeRate: number
  providerRewardsRecipient: string
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number
}

interface ApiErc20Delegation {
  providerId: number
  providerName?: string
  providerLogo?: string
  attesterAddress: string
  stakedAmount: string
  splitContract: string
  providerTakeRate: number
  providerRewardsRecipient: string
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number
}

interface ApiErc20DirectStake {
  attesterAddress: string
  withdrawerAddress: string
  stakedAmount: string
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
  txHash: string
  timestamp: number
  blockNumber: number
}

interface StakingApiResponse {
  totalStaked: string
  totalDirectStaked: string
  totalDelegated: string
  totalErc20Delegated: string
  totalErc20DirectStaked: string
  directStakeBreakdown: ApiDirectStake[]
  delegationBreakdown: ApiDelegation[]
  erc20DelegationBreakdown: ApiErc20Delegation[]
  erc20DirectStakeBreakdown: ApiErc20DirectStake[]
}

/**
 * Fetches staking data from the API for a given beneficiary
 */
async function fetchStakingData(beneficiary: Address): Promise<StakingApiResponse> {
  const response = await fetch(`${config.apiHost}/api/staking/${beneficiary}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch staking data: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Convert API direct stake response to DirectStakeBreakdown
 */
function parseDirectStake(stake: ApiDirectStake): DirectStakeBreakdown {
  return {
    atpAddress: stake.atpAddress as Address,
    attesterAddress: stake.attesterAddress as Address,
    stakedAmount: stringToBigInt(stake.stakedAmount),
    hasFailedDeposit: stake.hasFailedDeposit,
    failedDepositTxHash: stake.failedDepositTxHash,
    failureReason: stake.failureReason,
    status: stake.status,
    txHash: stake.txHash,
    timestamp: stake.timestamp,
    blockNumber: stake.blockNumber,

    // To include the provider's self-stake as my stake in a given provider
    providerId: stake.providerId,
    providerLogo: stake.providerLogo,
    providerName: stake.providerName
  }
}

/**
 * Create contract calls for a delegation (rollup rewards + split balance)
 */
function createDelegationContracts(delegation: ApiDelegation, tokenAddress: Address) {
  if (!delegation.splitContract) return []

  return [
    {
      address: contracts.rollup.address,
      abi: contracts.rollup.abi,
      functionName: 'getSequencerRewards',
      args: [delegation.splitContract as Address],
    },
    {
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: 'balanceOf',
      args: [delegation.splitContract as Address],
    },
  ]
}

/**
 * Parse delegation with rewards calculation
 */
function parseDelegation(
  delegation: ApiDelegation,
  rollupBalance: bigint,
  splitContractBalance: bigint
): DelegationBreakdown {
  // Calculate total user share from rollup and split contract only (omit warehouse)
  const userRewards = calculateTotalUserShareFromSplitRewards(
    rollupBalance,
    splitContractBalance,
    0n, // Omit warehouse balance
    delegation.providerTakeRate
  )

  return {
    atpAddress: delegation.atpAddress as Address,
    providerId: delegation.providerId,
    providerName: delegation.providerName,
    providerLogo: delegation.providerLogo,
    attesterAddress: delegation.attesterAddress as Address,
    stakedAmount: stringToBigInt(delegation.stakedAmount),
    rewards: delegation.hasFailedDeposit ? 0n : userRewards,
    splitContract: delegation.splitContract as Address,
    providerTakeRate: delegation.providerTakeRate,
    providerRewardsRecipient: delegation.providerRewardsRecipient as Address,
    hasFailedDeposit: delegation.hasFailedDeposit,
    failedDepositTxHash: delegation.failedDepositTxHash,
    failureReason: delegation.failureReason,
    status: delegation.status,
    txHash: delegation.txHash,
    timestamp: delegation.timestamp,
    blockNumber: delegation.blockNumber,
  }
}

/**
 * Create contract calls for an ERC20 delegation (rollup rewards + split balance)
 */
function createErc20DelegationContracts(delegation: ApiErc20Delegation, tokenAddress: Address) {
  if (!delegation.splitContract) return []

  return [
    {
      address: contracts.rollup.address,
      abi: contracts.rollup.abi,
      functionName: 'getSequencerRewards',
      args: [delegation.splitContract as Address],
    },
    {
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: 'balanceOf',
      args: [delegation.splitContract as Address],
    },
  ]
}

/**
 * Parse ERC20 delegation with rewards calculation
 */
function parseErc20Delegation(
  delegation: ApiErc20Delegation,
  rollupBalance: bigint,
  splitContractBalance: bigint
): Erc20DelegationBreakdown {
  const userRewards = calculateTotalUserShareFromSplitRewards(
    rollupBalance,
    splitContractBalance,
    0n,
    delegation.providerTakeRate
  )

  return {
    providerId: delegation.providerId,
    providerName: delegation.providerName,
    providerLogo: delegation.providerLogo,
    attesterAddress: delegation.attesterAddress as Address,
    stakedAmount: stringToBigInt(delegation.stakedAmount),
    rewards: delegation.hasFailedDeposit ? 0n : userRewards,
    splitContract: delegation.splitContract as Address,
    providerTakeRate: delegation.providerTakeRate,
    providerRewardsRecipient: delegation.providerRewardsRecipient as Address,
    hasFailedDeposit: delegation.hasFailedDeposit,
    failedDepositTxHash: delegation.failedDepositTxHash,
    failureReason: delegation.failureReason,
    status: delegation.status,
    txHash: delegation.txHash,
    timestamp: delegation.timestamp,
    blockNumber: delegation.blockNumber,
  }
}

/**
 * Parse ERC20 direct stake
 */
function parseErc20DirectStake(stake: ApiErc20DirectStake): Erc20DirectStakeBreakdown {
  return {
    attesterAddress: stake.attesterAddress as Address,
    withdrawerAddress: stake.withdrawerAddress as Address,
    stakedAmount: stringToBigInt(stake.stakedAmount),
    hasFailedDeposit: stake.hasFailedDeposit,
    failedDepositTxHash: stake.failedDepositTxHash,
    failureReason: stake.failureReason,
    status: stake.status,
    txHash: stake.txHash,
    timestamp: stake.timestamp,
    blockNumber: stake.blockNumber,
  }
}

/**
 * Hook to get aggregated staking data across multiple ATPs
 * Fetches staking positions from API and calculates delegation rewards from on-chain data
 */
export const useAggregatedStakingData = (): AggregatedStakingData => {
  const { address } = useAccount()
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Fetch staking data from API
  const {
    data: stakingData,
    isLoading: isLoadingApi,
    refetch: refetchStakingData
  } = useQuery<StakingApiResponse>({
    queryKey: ['staking-data', address],
    queryFn: () => fetchStakingData(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: Infinity,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })

  const directStakes = stakingData?.directStakeBreakdown ?? []
  const delegations = (stakingData?.delegationBreakdown ?? []).filter(delegation => delegation.splitContract)
  const erc20Delegations = (stakingData?.erc20DelegationBreakdown ?? []).filter(delegation => delegation.splitContract)
  const erc20DirectStakes = stakingData?.erc20DirectStakeBreakdown ?? []

  // Build contract calls for rollup balance + split contract balance (2 calls per delegation)
  // Combine ATP and ERC20 delegation contracts
  const delegationContracts = tokenAddress
    ? [
        ...delegations.flatMap(delegation => createDelegationContracts(delegation, tokenAddress)),
        ...erc20Delegations.flatMap(delegation => createErc20DelegationContracts(delegation, tokenAddress))
      ]
    : []

  // Fetch split contract rewards from rollup contract
  const { data: delegationData, isLoading: isLoadingDelegations, refetch: refetchDelegations } = useReadContracts({
    contracts: delegationContracts,
    query: {
      enabled: !!stakingData && !!tokenAddress && (delegations.length > 0 || erc20Delegations.length > 0),
      refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    },
  })

  // Get warehouse address from first split contract (all splits use the same warehouse)
  const firstSplitContract = delegations[0]?.splitContract as Address | undefined
  const { data: warehouseAddress } = useReadContract({
    address: firstSplitContract,
    abi: SplitAbi,
    functionName: "SPLITS_WAREHOUSE",
    query: {
      enabled: !!firstSplitContract,
    },
  })

  // Fetch user's warehouse balance (total distributed but not withdrawn across all delegations)
  const tokenId = tokenAddress ? BigInt(tokenAddress) : undefined
  const { data: warehouseBalance, isLoading: isLoadingWarehouse, refetch: refetchWarehouse } = useReadContract({
    address: warehouseAddress as Address | undefined,
    abi: SplitWarehouseAbi,
    functionName: "balanceOf",
    args: address && tokenId !== undefined ? [address, tokenId] : undefined,
    query: {
      enabled: !!warehouseAddress && !!address && tokenId !== undefined,
      refetchInterval: 30 * 1000,
    },
  })

  const isLoading = isLoadingApi || ((delegations.length > 0 || erc20Delegations.length > 0) && isLoadingDelegations) || isLoadingWarehouse

  // Parse ATP delegations with rewards from rollup and split contract
  const delegationBreakdown: DelegationBreakdown[] = delegations.map((delegation, index) => {
    const rollupBalance = (delegationData?.[index * 2]?.result as bigint) ?? 0n
    const splitContractBalance = (delegationData?.[index * 2 + 1]?.result as bigint) ?? 0n

    return parseDelegation(delegation, rollupBalance, splitContractBalance)
  })

  // Parse ERC20 delegations with rewards (offset by ATP delegation count)
  const atpDelegationContractCount = delegations.length * 2
  const erc20DelegationBreakdown: Erc20DelegationBreakdown[] = erc20Delegations.map((delegation, index) => {
    const dataIndex = atpDelegationContractCount + (index * 2)
    const rollupBalance = (delegationData?.[dataIndex]?.result as bigint) ?? 0n
    const splitContractBalance = (delegationData?.[dataIndex + 1]?.result as bigint) ?? 0n

    return parseErc20Delegation(delegation, rollupBalance, splitContractBalance)
  })

  // Parse direct stakes
  const directStakeBreakdown: DirectStakeBreakdown[] = directStakes.map(directStake => {
    return parseDirectStake(directStake)
  })

  // Parse ERC20 direct stakes from API
  const apiErc20DirectStakeBreakdown: Erc20DirectStakeBreakdown[] = erc20DirectStakes.map(stake => {
    return parseErc20DirectStake(stake)
  })

  // Get pending stakes from localStorage and merge with API data
  const pendingStakes = useMemo(() => {
    if (!address) return []
    return getPendingDirectStakes(address)
  }, [address])

  // Clean up stale pending stakes on mount
  useEffect(() => {
    cleanupStalePendingStakes()
  }, [])

  // Remove pending stakes that now appear in API response
  // This cleanup effect removes stakes from localStorage after the indexer processes them.
  // It runs AFTER the deduplication logic below, but that's fine because the deduplication
  // filters based on the API breakdown, not localStorage state.
  useEffect(() => {
    if (!address || pendingStakes.length === 0 || apiErc20DirectStakeBreakdown.length === 0) return

    const apiAttesterAddresses = apiErc20DirectStakeBreakdown.map(s => s.attesterAddress)
    const pendingAttesterAddresses = pendingStakes.map(s => s.attesterAddress)

    // Find pending stakes that are now in API
    const toRemove = pendingAttesterAddresses.filter(pending =>
      apiAttesterAddresses.some(api => api.toLowerCase() === pending.toLowerCase())
    )

    if (toRemove.length > 0) {
      removePendingDirectStakes(address, toRemove as Address[])
    }
  }, [address, pendingStakes, apiErc20DirectStakeBreakdown])

  // Merge pending stakes with API data (pending stakes that aren't in API yet)
  // DEDUPLICATION: Filter pending stakes by attester address to prevent showing stakes twice.
  // If a stake's attester address appears in the API breakdown, it's already indexed and should
  // not be shown from localStorage. This ensures no double-counting in the UI.
  const erc20DirectStakeBreakdown: Erc20DirectStakeBreakdown[] = useMemo(() => {
    const apiAttesterSet = new Set(
      apiErc20DirectStakeBreakdown.map(s => s.attesterAddress.toLowerCase())
    )

    // Convert pending stakes to breakdown format, excluding any already in API
    const pendingBreakdown: Erc20DirectStakeBreakdown[] = pendingStakes
      .filter(s => !apiAttesterSet.has(s.attesterAddress.toLowerCase()))
      .map(stake => ({
        attesterAddress: stake.attesterAddress,
        withdrawerAddress: stake.withdrawerAddress,
        stakedAmount: BigInt(stake.stakedAmount),
        hasFailedDeposit: false,
        failedDepositTxHash: null,
        failureReason: null,
        status: 'PENDING' as StakeStatus, // Show as PENDING/QUEUED
        txHash: stake.txHash,
        timestamp: stake.timestamp,
        blockNumber: 0, // Not yet in a block (from indexer perspective)
      }))

    // Pending stakes first (most recent), then API data
    return [...pendingBreakdown, ...apiErc20DirectStakeBreakdown]
  }, [apiErc20DirectStakeBreakdown, pendingStakes])

  // Use totalStaked from API which includes both ATP and ERC20 stakes
  // Note: pending stakes are added below after pendingStakesTotal is calculated
  const apiTotalStaked = stakingData?.totalStaked ? BigInt(stakingData.totalStaked) : 0n
  const totalDirectStaked = stakingData?.totalDirectStaked ? BigInt(stakingData.totalDirectStaked) : 0n
  const totalDelegated = stakingData?.totalDelegated ? BigInt(stakingData.totalDelegated) : 0n

  // Calculate rewards from both ATP and ERC20 delegations
  const atpDelegationRewards = delegationBreakdown.reduce((sum, delegation) => sum + delegation.rewards, 0n)
  const erc20DelegationRewards = erc20DelegationBreakdown.reduce((sum, delegation) => sum + delegation.rewards, 0n)
  const totalDelegationRewards = atpDelegationRewards + erc20DelegationRewards

  // ERC20-specific totals (wallet staking, not ATP)
  const totalErc20Delegated = stakingData?.totalErc20Delegated ? BigInt(stakingData.totalErc20Delegated) : 0n
  const apiTotalErc20DirectStaked = stakingData?.totalErc20DirectStaked ? BigInt(stakingData.totalErc20DirectStaked) : 0n

  // Include pending stakes in the total (only those not already in API)
  // DEDUPLICATION STRATEGY: This calculation is SAFE from double-counting because:
  // 1. API's totalErc20DirectStaked and erc20DirectStakeBreakdown come from the SAME source
  //    (see beneficiary-overview.ts - both derived from markedErc20DirectDeposits)
  // 2. We filter pending stakes by checking if their attester address exists in the breakdown
  // 3. If a stake is in the API breakdown, it's already included in apiTotalErc20DirectStaked
  // 4. Therefore, we only add pending stakes that are NOT yet in the API
  //
  // Edge case handled: Multiple stakes to same attester are prevented by localStorage
  // (see pendingDirectStakes.ts addPendingDirectStake - duplicate check)
  const pendingStakesTotal = useMemo(() => {
    const apiAttesterSet = new Set(
      apiErc20DirectStakeBreakdown.map(s => s.attesterAddress.toLowerCase())
    )
    return pendingStakes
      .filter(s => !apiAttesterSet.has(s.attesterAddress.toLowerCase()))
      .reduce((sum, s) => sum + BigInt(s.stakedAmount), 0n)
  }, [pendingStakes, apiErc20DirectStakeBreakdown])

  const totalErc20DirectStaked = apiTotalErc20DirectStaked + pendingStakesTotal
  const totalErc20Staked = totalErc20Delegated + totalErc20DirectStaked

  // Include pending stakes in totalStaked (API total + pending wallet stakes not yet indexed)
  const totalStaked = apiTotalStaked + pendingStakesTotal

  // Warehouse balance is already the user's share (distributed to their address)
  const pendingWarehouseWithdrawal = (warehouseBalance as bigint) ?? 0n

  return {
    totalStaked,
    totalDirectStaked,
    totalDelegated,
    totalErc20Staked,
    totalErc20Delegated,
    totalErc20DirectStaked,
    // Include warehouse balance in total rewards (tokens distributed but not yet withdrawn)
    totalRewards: totalDelegationRewards + pendingWarehouseWithdrawal,
    totalDelegationRewards,
    pendingWarehouseWithdrawal,
    directStakeBreakdown,
    delegationBreakdown,
    erc20DelegationBreakdown,
    erc20DirectStakeBreakdown,
    isLoading,
    refetch: async () => {
      await refetchStakingData()
      await refetchDelegations()
      await refetchWarehouse()
    },
  }
}
