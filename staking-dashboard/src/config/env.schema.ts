import { z } from "zod";

/**
 * Environment variable schema for application configuration
 * Separate from contract addresses which are handled in contracts/index.ts
 */
export const configEnvSchema = z.object({
  // Network configuration
  VITE_CHAIN_ID: z.string().transform((val) => parseInt(val, 10)),
  VITE_RPC_URL: z.string().url(),

  // API configuration
  VITE_API_HOST: z.string().url().optional().default("http://localhost:3000"),

  // WalletConnect configuration
  VITE_WALLETCONNECT_PROJECT_ID: z.string().optional(),
});

/**
 * Type inference for validated config environment variables
 */
export type ConfigEnv = z.infer<typeof configEnvSchema>;