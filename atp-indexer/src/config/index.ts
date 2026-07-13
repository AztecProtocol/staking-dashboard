import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Get network name from chain ID
 */
export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return 'mainnet';
    case 11155111:
      return 'sepolia';
    case 17000:
      return 'holesky';
    case 31337:
      return 'anvil';
    default:
      throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: mainnet (1), sepolia (11155111), holesky (17000), anvil (31337)`);
  }
};

/**
 * Environment configuration schema
 */
const configSchema = z.object({
  // Database
  POSTGRES_CONNECTION_STRING: z.optional(
    z.string().refine(
      (val) => val === '' || val === null || z.string().url().safeParse(val).success,
      { message: 'POSTGRES_CONNECTION_STRING must be a valid URL or an empty string' }
    ).nullable()
  ),

  // Blockchain RPC (supports multiple URLs separated by comma)
  RPC_URL: z.string().transform((val) => {
    const urls = val.split(',').map(url => url.trim());
    urls.forEach(url => {
      if (!z.string().url().safeParse(url).success) {
        throw new Error(`Invalid RPC URL: ${url}`);
      }
    });
    return urls;
  }),
  CHAIN_ID: z.string().transform(Number).default('1'),

  // Contract addresses
  ATP_FACTORY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  ATP_FACTORY_AUCTION_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  // MATP/LATP factories aren't deployed in every environment (e.g.,
  // testnet has only genesis + auction). The deploy pipeline propagates
  // unset GitHub Actions vars → terraform vars → ECS env as the empty
  // string `""`, NOT as undefined, so we preprocess `""` → undefined
  // before the regex check; `.optional()` then accepts undefined.
  // ponder.config.ts falls back to the zero address when these resolve
  // to undefined, see comments there.
  ATP_FACTORY_MATP_ADDRESS: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional(),
  ),
  ATP_FACTORY_LATP_ADDRESS: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional(),
  ),
  STAKING_REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),

  // Indexer settings
  START_BLOCK: z.string().transform(Number).refine(n => n >= 0, 'START_BLOCK must be non-negative').default('0'),
  MATP_FACTORY_START_BLOCK: z.string().transform(Number).refine(n => n >= 0, 'MATP_FACTORY_START_BLOCK must be non-negative').optional(),
  LATP_FACTORY_START_BLOCK: z.string().transform(Number).refine(n => n >= 0, 'LATP_FACTORY_START_BLOCK must be non-negative').optional(),
  REGISTRY_START_BLOCK: z.string().transform(Number).refine(n => n >= 0, 'REGISTRY_START_BLOCK must be non-negative').default('0'),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate limiting (disabled by default)
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('false'),

  // Short-TTL response cache for the read-only /api/* GET routes; 0 disables it.
  API_CACHE_TTL_MS: z.string().transform(Number).pipe(z.number().int().min(0)).default('10000'),
});

/**
 * Lazy-load configuration 
 */
let lazyConfig: (z.infer<typeof configSchema> & { networkName: string }) | null = null;

export type Config = z.infer<typeof configSchema> & { networkName: string };

export const config = new Proxy({} as Config, {
  get(target, prop) {
    if (!lazyConfig) {
      const rawConfig = configSchema.parse(process.env);
      lazyConfig = {
        ...rawConfig,
        networkName: getNetworkName(rawConfig.CHAIN_ID),
      };
    }
    return lazyConfig[prop as keyof typeof lazyConfig];
  }
});
