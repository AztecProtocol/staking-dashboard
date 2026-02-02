import { z } from "zod";
import { BaseATPSchema } from "../atpBaseTypes";

// MATP-specific fields (partial schema for extending base)
export const MATPPartialSchema = z.object({
  milestoneId: z.bigint().optional(),
});

// Complete MATP schema - extends base with MATP-specific fields
// Used by useMATPData and useMultipleMATPData hooks
export const MATPDataSchema = BaseATPSchema.merge(MATPPartialSchema);

// TypeScript type inferred from Zod schema
export type MATPData = z.infer<typeof MATPDataSchema>;

/**
 * Type guard to check if ATP data is MATP
 */
export function isMATPData(data: unknown): data is MATPData {
  const result = MATPDataSchema.safeParse(data);
  return result.success && result.data.typeString === 'MATP';
}