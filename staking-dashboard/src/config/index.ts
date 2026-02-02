import { configEnvSchema } from "./env.schema";

/**
 * Parsed and validated configuration from environment variables
 * This handles non-contract configuration like API endpoints, network settings, etc.
 * Contract addresses are handled separately in contracts/index.ts
 */
const env = configEnvSchema.parse(import.meta.env);

/**
 * Application configuration object
 */
export const config = {
  // Network settings
  chainId: env.VITE_CHAIN_ID,
  rpcUrl: env.VITE_RPC_URL,

  // API settings
  apiHost: env.VITE_API_HOST,

  // WalletConnect settings
  walletConnectProjectId: env.VITE_WALLETCONNECT_PROJECT_ID,
} as const;

/**
 * Re-export types
 */
export type { ConfigEnv } from "./env.schema";