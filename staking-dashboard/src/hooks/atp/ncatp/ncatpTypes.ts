import { z } from "zod";
import { BaseATPSchema } from "../atpBaseTypes";
import { LATPPartialSchema } from "../latp";

/**
 * NCATP-specific fields (partial schema for extending base)
 * Non Claim ATP includes all LATP properties
 */
export const NCATPPartialSchema = z.object({
  CREATED_AT_TIMESTAMP: z.bigint().optional()
}).merge(LATPPartialSchema);

export const NCATPDataSchema = BaseATPSchema.merge(NCATPPartialSchema);

export type NCATPData = z.infer<typeof NCATPDataSchema>;

export function isNCATPData(data: unknown): data is NCATPData {
  const result = NCATPDataSchema.safeParse(data);
  return result.success && result.data.typeString === 'NCATP';
}