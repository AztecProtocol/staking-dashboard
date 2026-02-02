/**
 * Centralized ATP contract function definitions
 */

export const BASE_ATP_FUNCTIONS = [
  "getAllocation",
  "getBeneficiary",
  "getOperator",
  "getStaker",
  "getClaimable",
  "getClaimed",
  "getGlobalLock",
  "getRegistry",
  "getType",
  "getToken",
  "getExecuteAllowedAt",
] as const;

export const MATP_SPECIFIC_FUNCTIONS = [
  "getMilestoneId",
] as const;

export const LATP_SPECIFIC_FUNCTIONS = [
  "getIsRevokable",
  "getRevokeBeneficiary",
  "getAccumulationLock",
  "getStakeableAmount"
] as const;

export const NCATP_SPECIFIC_FUNCTIONS = [
  ...LATP_SPECIFIC_FUNCTIONS,
  "CREATED_AT_TIMESTAMP"
]

// Complete function lists for each type
export const MATP_FUNCTIONS = [...BASE_ATP_FUNCTIONS, ...MATP_SPECIFIC_FUNCTIONS] as const;
export const LATP_FUNCTIONS = [...BASE_ATP_FUNCTIONS, ...LATP_SPECIFIC_FUNCTIONS] as const;
export const NCATP_FUNCTIONS = [...BASE_ATP_FUNCTIONS, ...NCATP_SPECIFIC_FUNCTIONS] as const;
export const ALL_ATP_FUNCTIONS = [...BASE_ATP_FUNCTIONS, ...MATP_SPECIFIC_FUNCTIONS, ...LATP_SPECIFIC_FUNCTIONS] as const;

// Type definitions
export type BaseATPFunction = typeof BASE_ATP_FUNCTIONS[number];
export type MATPFunction = typeof MATP_FUNCTIONS[number];
export type LATPFunction = typeof LATP_FUNCTIONS[number];
export type NCATPFunction = typeof NCATP_FUNCTIONS[number];
export type ATPFunction = typeof ALL_ATP_FUNCTIONS[number];