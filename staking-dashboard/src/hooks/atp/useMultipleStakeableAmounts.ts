import { useReadContracts } from 'wagmi'
import type { ATPData } from './atpTypes'
import { ERC20Abi } from '../../contracts/abis/ERC20'
import { LATPAbi } from '../../contracts/abis/LATP'
import { useRollupData } from '../rollup/useRollupData'
import { calculateStakeableAmount, usesGetStakeableAmount } from './useStakeableAmount'

/**
 * Extended ATP data with staking information
 */
export interface StakeableATPData extends ATPData {
  stakeableAmount: bigint
  hasStakeableAmount: boolean
  isStakeable: boolean
}

/**
 * Type guard to check if an ATPData object is a StakeableATPData
 */
export function isStakeableATPData(atp: ATPData | null): atp is StakeableATPData {
  return atp !== null && 'stakeableAmount' in atp
}

/**
 * Return type for useMultipleStakeableAmounts hook
 */
export interface MultipleStakeableAmountsResult {
  atpStakeableData: StakeableATPData[]
  stakeableAtps: StakeableATPData[]
  totalValidatorCount: number
  totalStakeableAmount: bigint
  activationThreshold?: bigint
  isLoading: boolean
  refetch: () => void
}

/**
 * Create contract call config for an ATP
 */
function createContractCall(atp: ATPData) {
  if (usesGetStakeableAmount(atp)) {
    return {
      address: atp.atpAddress,
      abi: LATPAbi,
      functionName: 'getStakeableAmount',
    }
  }
  return {
    address: atp.token,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [atp.atpAddress],
  }
}

/**
 * Hook to get stakeable amounts for multiple ATP positions
 * Efficiently batches contract calls for all ATPs
 */
export function useMultipleStakeableAmounts(atpData: ATPData[]): MultipleStakeableAmountsResult {
  const { activationThreshold, isLoading: isLoadingThreshold } = useRollupData()

  // Build contracts array and track mapping
  const contractMapping: { atpIndex: number; contractIndex: number }[] = []
  const contracts = atpData
    .map((atp, atpIndex) => ({ call: createContractCall(atp), atpIndex }))
    .map(({ call, atpIndex }, contractIndex) => {
      contractMapping.push({ atpIndex, contractIndex })
      return call!
    })

  const { data: contractResults, isLoading: isLoadingContracts, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  })

  // Build result lookup by ATP index
  const resultsByAtpIndex = new Map<number, bigint>()
  contractMapping.forEach(({ atpIndex, contractIndex }) => {
    const result = contractResults?.[contractIndex]
    if (result?.status === 'success') {
      resultsByAtpIndex.set(atpIndex, result.result as bigint)
    }
  })

  // Map ATPs with their stakeable amounts
  const atpStakeableData: StakeableATPData[] = atpData.map((atp, index) => {
    const rawAmount = resultsByAtpIndex.get(index)
    const stakeableAmount = calculateStakeableAmount(rawAmount ?? 0n, activationThreshold ?? 0n)
    const isStakeable = stakeableAmount >= (activationThreshold ?? 0n)

    return {
      ...atp,
      stakeableAmount,
      hasStakeableAmount: stakeableAmount !== undefined && stakeableAmount > 0n,
      isStakeable,
    }
  })

  const stakeableAtps = atpStakeableData.filter(atp => atp.isStakeable)

  // Calculate totals
  const totalValidatorCount = activationThreshold
    ? stakeableAtps.reduce((total, atp) =>
      total + Number((atp.stakeableAmount ?? 0n) / activationThreshold), 0)
    : 0

  const totalStakeableAmount = stakeableAtps.reduce(
    (total, atp) => total + (atp.stakeableAmount ?? 0n),
    0n
  )

  return {
    atpStakeableData,
    stakeableAtps,
    totalValidatorCount,
    totalStakeableAmount,
    activationThreshold,
    isLoading: isLoadingContracts || isLoadingThreshold,
    refetch,
  }
}