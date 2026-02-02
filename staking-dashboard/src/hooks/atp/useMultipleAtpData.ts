import { useReadContracts } from "wagmi";
import { type ATPData } from "./atpTypes";
import type { ATPHolding } from "./useAtpHoldings";
import { CommonATPAbi } from "../../contracts/abis/ATP";
import { MATPAbi } from "../../contracts/abis/MATP";
import { LATPAbi } from "../../contracts/abis/LATP";
import { BASE_ATP_FUNCTIONS, MATP_SPECIFIC_FUNCTIONS, LATP_SPECIFIC_FUNCTIONS, NCATP_SPECIFIC_FUNCTIONS } from "./atpContractDefinitions";
import { buildMATPData } from "./matp";
import { buildLATPData } from "./latp";
import { buildNCATPData } from "./ncatp/ncatpDataBuilder";
import { NCATPAbi } from "@/contracts/abis/NCATP";
import { ATPWithdrawableAndClaimableStakerAbi } from "@/contracts/abis/ATPWithdrawableAndClaimableStaker";
import type { Address } from "viem";

/**
 * Create contract calls for a single ATP holding
 */
function createContractCalls(holding: ATPHolding) {
  const address = holding.address as `0x${string}`;

  const baseCalls = BASE_ATP_FUNCTIONS.map((functionName) => ({
    address,
    abi: CommonATPAbi,
    functionName,
  }));

  const typeSpecificCalls =
    holding.type === 'MATP'
      ? MATP_SPECIFIC_FUNCTIONS.map((functionName) => ({
        address,
        abi: MATPAbi,
        functionName,
      }))
      : holding.type === 'LATP'
        ? LATP_SPECIFIC_FUNCTIONS.map((functionName) => ({
          address,
          abi: LATPAbi,
          functionName,
        }))
        : holding.type === 'NCATP'
          ? NCATP_SPECIFIC_FUNCTIONS.map((functionName) => ({
            address,
            abi: NCATPAbi,
            functionName,
          }))
          : [];

  return [...baseCalls, ...typeSpecificCalls];
}

/**
 * Build ATP data from contract results
 */
function buildAtpData(
  holding: ATPHolding,
  results: any[],
  overrides?: { withdrawalTimestamp?: bigint; hasStaked?: boolean }
): ATPData {
  const address = holding.address as `0x${string}`;
  const totalWithdrawn = BigInt(holding.totalWithdrawn || '0');
  const totalSlashed = BigInt(holding.totalSlashed || '0');

  if (holding.type === 'MATP') {
    const data = buildMATPData(address, results);
    return { ...data, sequentialNumber: holding.sequentialNumber, totalWithdrawn, totalSlashed };
  }

  if (holding.type === 'LATP') {
    // Not overriding the global lock because the ATPRegistryAuction global lock params already returns the correct timestamp
    // https://etherscan.io/address/0x63841bAD6B35b6419e15cA9bBBbDf446D4dC3dde#readContract
    const data = buildLATPData(address, results);
    return { ...data, sequentialNumber: holding.sequentialNumber, totalWithdrawn, totalSlashed };
  }

  if (holding.type === 'NCATP') {
    const data = buildNCATPData(address, results, {
      // Override globalLock startTime with token sale date
      // November 13, 2025
      // https://dashnode.slack.com/archives/C09G2KKKGBS/p1763062211664109?thread_ts=1763049077.653819&cid=C09G2KKKGBS
      startLockTimestamp: BigInt(1763042400),

      withdrawalTimestamp: overrides?.withdrawalTimestamp,
      hasStaked: overrides?.hasStaked
    });
    return { ...data, sequentialNumber: holding.sequentialNumber, totalWithdrawn, totalSlashed };
  }

  // Unknown type fallback
  return {
    atpAddress: address,
    typeString: 'Unknown',
    allocation: undefined,
    beneficiary: undefined,
    operator: undefined,
    staker: undefined,
    claimable: undefined,
    claimed: undefined,
    globalLock: undefined,
    registry: undefined,
    type: undefined,
    token: undefined,
    executeAllowedAt: undefined,
    sequentialNumber: holding.sequentialNumber,
    totalWithdrawn,
    totalSlashed,
  } as ATPData;
}

/**
 * Hook to fetch detailed ATP data for multiple holdings using batch contract calls
 */
export function useMultipleAtpData(atpHoldings: ATPHolding[]) {
  const holdingRanges: Array<{ holdingIndex: number; startIndex: number; count: number }> = [];
  let currentIndex = 0;

  const contracts = atpHoldings.flatMap((holding, holdingIndex) => {
    const calls = createContractCalls(holding);
    holdingRanges.push({
      holdingIndex,
      startIndex: currentIndex,
      count: calls.length,
    });
    currentIndex += calls.length;
    return calls;
  });

  const {
    data: rawResults,
    isLoading: isLoadingContracts,
    error,
    refetch,
  } = useReadContracts({
    contracts,
  });

  // Build staker contract calls for NCATP holdings (hasStaked + WITHDRAWAL_TIMESTAMP per staker)
  const stakerContracts: { address: Address; abi: typeof ATPWithdrawableAndClaimableStakerAbi; functionName: 'hasStaked' | 'WITHDRAWAL_TIMESTAMP' }[] = [];
  const stakerIndexMap: number[] = [];

  atpHoldings.forEach((holding, index) => {
    if (holding.type === 'NCATP') {
      const range = holdingRanges[index];

      // Get staker address for this NCATP (index 3 in BASE_ATP_FUNCTIONS is getStaker)
      const stakerAddress = rawResults?.[range.startIndex + 3]?.result as Address | undefined;

      if (stakerAddress) {
        // Add hasStaked call
        stakerContracts.push({
          address: stakerAddress,
          abi: ATPWithdrawableAndClaimableStakerAbi,
          functionName: 'hasStaked'
        });
        // Add WITHDRAWAL_TIMESTAMP call
        stakerContracts.push({
          address: stakerAddress,
          abi: ATPWithdrawableAndClaimableStakerAbi,
          functionName: 'WITHDRAWAL_TIMESTAMP'
        });
        stakerIndexMap.push(index);
      }
    }
  });

  const {
    data: stakerResults,
  } = useReadContracts({
    contracts: stakerContracts,
    query: {
      enabled: stakerContracts.length > 0 && !isLoadingContracts,
    }
  });

  // Create maps of holding index to hasStaked and withdrawalTimestamp results
  // Each NCATP has 2 contract calls: hasStaked (even index) and WITHDRAWAL_TIMESTAMP (odd index)
  const hasStakedMap = new Map<number, boolean>();
  const withdrawalTimestampMap = new Map<number, bigint>();
  stakerIndexMap.forEach((holdingIndex, idx) => {
    const hasStakedResult = stakerResults?.[idx * 2]?.result as boolean | undefined;
    const withdrawalTimestampResult = stakerResults?.[idx * 2 + 1]?.result as bigint | undefined;
    if (hasStakedResult !== undefined) {
      hasStakedMap.set(holdingIndex, hasStakedResult);
    }
    if (withdrawalTimestampResult !== undefined) {
      withdrawalTimestampMap.set(holdingIndex, withdrawalTimestampResult);
    }
  });

  // Map contract calls results back to holdings
  const atpData: ATPData[] = atpHoldings.map((holding, index) => {
    const range = holdingRanges[index];
    const holdingResults = rawResults?.slice(range.startIndex, range.startIndex + range.count) ?? [];
    const hasStaked = holding.type === 'NCATP' ? hasStakedMap.get(index) : undefined;
    const withdrawalTimestamp = holding.type === 'NCATP' ? withdrawalTimestampMap.get(index) : undefined;

    return buildAtpData(holding, holdingResults, { withdrawalTimestamp, hasStaked });
  });

  return {
    data: atpData,
    isLoading: isLoadingContracts,
    error,
    refetch,
  };
}