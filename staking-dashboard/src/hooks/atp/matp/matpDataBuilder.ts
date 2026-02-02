import type { Address } from "viem";
import { MATPDataSchema, type MATPData } from "./matpTypes";

/**
 * Builds MATP data from raw contract results
 * Shared utility for useMATPDetails and useMultipleAtpData
 */
export function buildMATPData(
  matpAddress: Address,
  rawResults: Array<{ result?: unknown } | undefined>
): MATPData {
  const rawData = {
    atpAddress: matpAddress,
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
    milestoneId: rawResults?.[11]?.result,
    typeString: 'MATP' as const,
  };

  // Use Zod to safely parse and validate the data
  const result = MATPDataSchema.safeParse(rawData);

  if (result.success) {
    const data = result.data;
    return data;
  }

  // Log validation errors and return fallback data
  console.warn(`MATP data validation failed for ${matpAddress}:`, result);
  return {
    atpAddress: matpAddress,
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
    milestoneId: undefined,
    typeString: 'MATP',
  };
}