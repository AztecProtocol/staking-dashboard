import type { Address } from "viem";
import { LATPDataSchema, type LATPData } from "./latpTypes";

interface LATPOverrides {
  startLockTimestamp?: bigint;
}

/**
 * Builds LATP data from raw contract results
 * Shared utility for useLATPDetails and useMultipleAtpData
 */
export function buildLATPData(
  latpAddress: Address,
  rawResults: Array<{ result?: unknown } | undefined>,
  overrides?: LATPOverrides
): LATPData {
  const rawData = {
    atpAddress: latpAddress,
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
    typeString: 'LATP' as const,
  };

  // Use Zod to safely parse and validate the data
  const result = LATPDataSchema.safeParse(rawData);

  if (result.success) {
    const data = result.data;

    if (overrides?.startLockTimestamp !== undefined && data.globalLock) {
      data.globalLock.startTime = BigInt(overrides.startLockTimestamp);
    }

    return data;
  }

  // Log validation errors and return fallback data
  console.warn(`LATP data validation failed for ${latpAddress}:`, result.error);
  return {
    atpAddress: latpAddress,
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
    typeString: 'LATP',
  };
}