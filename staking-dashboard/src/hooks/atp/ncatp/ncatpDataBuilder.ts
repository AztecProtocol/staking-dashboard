import type { Address } from "viem";
import { NCATPDataSchema, type NCATPData } from "./ncatpTypes";

interface NCATPOverrides {
  startLockTimestamp?: bigint;
  withdrawalTimestamp?: bigint;
  hasStaked?: boolean;
}

/**
 * Builds NCATP data from raw contract results
 * Shared utility for useNCATPDetails and useMultipleAtpData
 */
export function buildNCATPData(
  atpAddress: Address,
  rawResults: Array<{ result?: unknown } | undefined>,
  overrides?: NCATPOverrides
): NCATPData {
  const rawData = {
    atpAddress: atpAddress,
    allocation: rawResults?.[0]?.result,
    beneficiary: rawResults?.[1]?.result,
    operator: rawResults?.[2]?.result,
    staker: rawResults?.[3]?.result,
    claimable: rawResults?.[4]?.result,
    claimed: rawResults?.[5]?.result,
    globalLock: rawResults?.[6]?.result,
    registry: rawResults?.[7]?.result,
    type: rawResults?.[8]?.result,
    token: rawResults?.[9]?.result,
    executeAllowedAt: rawResults?.[10]?.result,
    isRevokable: rawResults?.[11]?.result,
    revokeBeneficiary: rawResults?.[12]?.result,
    accumulationLock: rawResults?.[13]?.result,
    CREATED_AT_TIMESTAMP: rawResults?.[14]?.result,
    typeString: 'NCATP' as const,
  };

  // Use Zod to safely parse and validate the data
  const result = NCATPDataSchema.safeParse(rawData);

  if (result.success) {
    const data = result.data;

    if (overrides?.startLockTimestamp !== undefined && data.globalLock) {
      data.globalLock.startTime = overrides.startLockTimestamp
    }

    // For NCATP, override cliff and endTime with WITHDRAWAL_TIMESTAMP from staker contract
    if (overrides?.withdrawalTimestamp !== undefined && data.globalLock) {
      data.globalLock.cliff = overrides.withdrawalTimestamp;
      data.globalLock.endTime = overrides.withdrawalTimestamp;
    }

    // Override claimable to equal allocation if after withdrawal timestamp and has staked
    const now = BigInt(Math.floor(Date.now() / 1000));
    const canWithdraw = overrides?.withdrawalTimestamp !== undefined && now >= overrides.withdrawalTimestamp;

    if (canWithdraw && overrides?.hasStaked && data.allocation !== undefined) {
      data.claimable = data.allocation;
    }

    return {
      ...data,
      globalLock: data.globalLock && data.CREATED_AT_TIMESTAMP ? {
        ...data.globalLock,
      } : data.globalLock
    };
  }

  // Log validation errors and return fallback data
  console.warn(`NCATP data validation failed for ${atpAddress}:`, result.error);
  return {
    atpAddress: atpAddress,
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
    isRevokable: undefined,
    revokeBeneficiary: undefined,
    accumulationStartTime: undefined,
    accumulationCliffDuration: undefined,
    accumulationLockDuration: undefined,
    typeString: 'NCATP',
  };
}