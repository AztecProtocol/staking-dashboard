import { z } from "zod";
import { BaseATPSchema } from "./atpBaseTypes";
import { MATPPartialSchema } from "./matp/matpTypes";
import { LATPPartialSchema } from "./latp/latpTypes";
import { NCATPPartialSchema } from "./ncatp/ncatpTypes";

// Unified ATP schema - includes all fields from all ATP types
// Used by components that need to handle any ATP type (like ATPCard)
// This merges base schema with type-specific fields from their respective modules
export const ATPDataSchema = BaseATPSchema.merge(MATPPartialSchema).merge(LATPPartialSchema).merge(NCATPPartialSchema);

// TypeScript type inferred from Zod schema
export type ATPData = z.infer<typeof ATPDataSchema>;

export type ATPType = 'MATP' | 'LATP' | 'NCATP' | 'Unknown'

// Stake status enum - shared across all stake-related types
export type StakeStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNSTAKED' | null