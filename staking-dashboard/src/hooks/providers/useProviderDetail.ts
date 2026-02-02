import { useCallback } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { config } from "@/config"
import { formatBipsToPercentage } from "@/utils/formatNumber"
import { stringToBigInt } from "@/utils/atpFormatters"
import { useProviderConfigurations } from "@/hooks/stakingRegistry/useProviderConfigurations"
import { zeroAddress } from "viem"

interface StakeATP {
  address: string
  type: string
  beneficiary: string
  allocation: string
}

interface ProviderStake {
  atpAddress: string
  stakerAddress: string
  splitContractAddress: string
  rollupAddress: string
  attesterAddress: string
  stakedAmount: string
  blockNumber: string
  txHash: string
  timestamp: string
  atp: StakeATP
}

interface TakeRateHistoryEntry {
  takeRate: number
  blockNumber: string
  timestamp: string
}

/**
 * API response structure for provider detail endpoint
 */
interface ProviderDetailResponse {
  id: string
  name: string
  commission: number
  address: string
  totalStaked: string
  networkTotalStaked: string
  delegators: number
  attesterCount: number
  createdAtBlock: string
  createdAtTx: string
  createdAtTime: string
  website?: string
  email?: string
  description?: string
  logoUrl?: string
  stakes: ProviderStake[]
  takeRateHistory: TakeRateHistoryEntry[]
}

/**
 * Transformed provider detail structure for UI consumption
 */
export interface ProviderDetail {
  id: string
  name: string
  logo_url?: string
  totalStaked: string
  percentage: string
  commission: string
  delegators: string
  website?: string
  email?: string
  address: string
  description?: string
  attesterCount: number
  createdAtBlock: string
  createdAtTx: string
  createdAtTime: string
  stakes: ProviderStake[]
  takeRateHistory: TakeRateHistoryEntry[]
}

/**
 * Calculate provider's percentage of network stake
 */
function calculatePercentage(totalStaked: string, networkTotal: string): string {
  const totalStake = parseFloat(totalStaked || '0')
  const networkTotalStake = parseFloat(networkTotal || '0')

  if (networkTotalStake === 0) return '0'

  const percentage = (totalStake / networkTotalStake) * 100
  return percentage.toFixed(1)
}

/**
 * Transform API response to UI-friendly format
 */
function transformProviderData(data: ProviderDetailResponse): ProviderDetail {
  const percentage = calculatePercentage(data.totalStaked, data.networkTotalStaked)

  return {
    id: data.id,
    name: data.name,
    logo_url: data.logoUrl,
    totalStaked: data.totalStaked || '0',
    percentage: `${percentage}%`,
    commission: `${formatBipsToPercentage(data.commission)}%`,
    delegators: data.delegators.toString(),
    website: data.website,
    email: data.email,
    address: data.address,
    description: data.description,
    attesterCount: data.attesterCount,
    createdAtBlock: data.createdAtBlock,
    createdAtTx: data.createdAtTx,
    createdAtTime: data.createdAtTime,
    stakes: data.stakes,
    takeRateHistory: data.takeRateHistory
  }
}

/**
 * Fetch provider details from API
 */
async function fetchProviderDetail(id: string): Promise<ProviderDetailResponse> {
  const response = await fetch(`${config.apiHost}/api/providers/${id}`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * Hook for managing provider detail data based on URL parameter
 */
export const useProviderDetail = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: providerData, isLoading, error, refetch } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => fetchProviderDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Fetch on-chain provider configuration
  const {
    providerAdmin,
    providerTakeRate,
    isLoading: isLoadingConfig
  } = useProviderConfigurations(Number(id))

  let provider = providerData ? transformProviderData(providerData) : null

  // Override address and commission with on-chain data if available
  if (provider) {
    if (providerAdmin && providerAdmin !== zeroAddress) {
      provider = {
        ...provider,
        address: providerAdmin
      }
    }
    if (providerTakeRate !== undefined) {
      provider = {
        ...provider,
        commission: `${formatBipsToPercentage(providerTakeRate)}%`
      }
    }
  }

  /**
   * Optimistically update total staked and delegators count
   * Used after successful delegation for immediate UI feedback
   */
  const addProviderStake = useCallback((stakedAmount: bigint, stakedCount: number = 1) => {
    if (!id) return

    queryClient.setQueryData<ProviderDetailResponse>(['provider', id], (oldData) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        totalStaked: (stringToBigInt(oldData.totalStaked) + stakedAmount).toString(),
        delegators: oldData.delegators + stakedCount
      }
    })
  }, [id, queryClient])

  const errorMessage = error?.message ??
    (!provider && !isLoading && id ? `Provider with ID ${id} not found` : null)

  return {
    provider,
    isLoading: isLoading || isLoadingConfig,
    error: errorMessage,
    refetch,
    addProviderStake
  }
}