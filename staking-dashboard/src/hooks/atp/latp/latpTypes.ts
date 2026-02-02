import { z } from "zod";
import { BaseATPSchema, AddressSchema } from "../atpBaseTypes";

/**
 * LATP-specific fields (partial schema for extending base)
 * Linear ATP includes accumulation time parameters
 */
export const LATPPartialSchema = z.object({
  isRevokable: z.boolean().optional(),
  revokeBeneficiary: AddressSchema.optional(),
  accumulationStartTime: z.bigint().optional(),
  accumulationCliffDuration: z.bigint().optional(),
  accumulationLockDuration: z.bigint().optional(),
});

/**
 * Complete LATP schema - extends base with LATP-specific fields
 * Used by useLATPData and useMultipleLATPData hooks
 */
export const LATPDataSchema = BaseATPSchema.merge(LATPPartialSchema);

/**
 * TypeScript type inferred from Zod schema
 */
export type LATPData = z.infer<typeof LATPDataSchema>;

/**
 * Type guard to check if ATP data is LATP
 */
export function isLATPData(data: unknown): data is LATPData {
  const result = LATPDataSchema.safeParse(data);
  return result.success && result.data.typeString === 'LATP';
}