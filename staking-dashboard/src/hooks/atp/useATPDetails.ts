import { useQuery } from '@tanstack/react-query'
import { config } from '@/config'
import type { ATPData, StakeStatus } from './index'
import { stringToBigInt } from '@/utils/atpFormatters'

export interface DirectStake {
  attesterAddress: string
  operatorAddress: string
  stakedAmount: bigint
  txHash: string
  timestamp: string
  blockNumber: number
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
}

export interface Delegation {
  providerId: number
  providerName?: string
  providerLogo?: string
  operatorAddress: string
  splitContract: string
  providerTakeRate: number
  providerRewardsRecipient: string
  stakedAmount: bigint
  txHash: string
  timestamp: string
  blockNumber: number
  hasFailedDeposit: boolean
  failedDepositTxHash: string | null
  failureReason: string | null
  status: StakeStatus
}

interface ATPDetailsSummary {
  totalStaked: bigint
}

export interface ATPDetailsData {
  atp: ATPData
  summary: ATPDetailsSummary
  directStakes: DirectStake[]
  delegations: Delegation[]
}

interface ATPDetailsResponse {
  atp: {
    atpAddress: string
    allocation: string
  }
  summary: {
    totalStaked: string
  }
  directStakes: DirectStake[]
  delegations: Delegation[]
}

/**
 * Transforms API response with string BigInts to proper BigInt types
 */
const transformATPDetailsResponse = (response: ATPDetailsResponse, atpData: ATPData): ATPDetailsData => {
  return {
    atp: atpData,
    summary: {
      totalStaked: stringToBigInt(response.summary.totalStaked)
    },
    directStakes: response.directStakes,
    delegations: response.delegations.map(delegation => ({
      ...delegation,
      stakedAmount: stringToBigInt(delegation.stakedAmount)
    }))
  }
}

/**
 * Fetches detailed ATP information including staking and delegation data
 */
const fetchATPDetails = async (atp: ATPData): Promise<ATPDetailsData> => {
  const response = await fetch(`${config.apiHost}/api/atp/${atp.atpAddress}/details`)

  if (!response.ok) {
    throw new Error(`Failed to fetch ATP details: ${response.statusText}`)
  }

  const data: ATPDetailsResponse = await response.json()
  return transformATPDetailsResponse(data, atp)
}

/**
 * Hook to get comprehensive ATP details including staking and delegation information
 * Only fetches when isModalOpen is true
 */
export const useATPDetails = (atp: ATPData, isModalOpen: boolean = false) => {
  return useQuery({
    queryKey: ['atp-details', atp.atpAddress],
    queryFn: () => fetchATPDetails(atp),
    enabled: isModalOpen,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}