import { z } from "zod";
import type { Address } from "viem";

// Custom Zod schema for Ethereum addresses
export const AddressSchema = z
  .string()
  .refine((val): val is Address => /^0x[a-fA-F0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address format",
  }) as z.ZodType<Address>;

// Zod schema for GlobalLock structure
export const GlobalLockSchema = z
  .object({
    startTime: z.bigint(),
    cliff: z.bigint(),
    endTime: z.bigint(),
    allocation: z.bigint(),
  })
  .optional();

// Base ATP schema - common fields shared by all ATP types
export const BaseATPSchema = z.object({
  atpAddress: AddressSchema,
  allocation: z.bigint().optional(),
  beneficiary: AddressSchema.optional(),
  operator: AddressSchema.optional(),
  staker: AddressSchema.optional(),
  claimable: z.bigint().optional(),
  claimed: z.bigint().optional(),
  globalLock: GlobalLockSchema,
  registry: AddressSchema.optional(),
  type: z.number().optional(),
  typeString: z.enum(['MATP', 'LATP', 'NCATP', 'Unknown']).optional(),
  token: AddressSchema.optional(),
  executeAllowedAt: z.bigint().optional(),
  sequentialNumber: z.number().optional(),
  totalWithdrawn: z.bigint().optional(),
  totalSlashed: z.bigint().optional(),
});

// Base ATP data type
export type BaseATPData = z.infer<typeof BaseATPSchema>;