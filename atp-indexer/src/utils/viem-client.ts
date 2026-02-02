import { createPublicClient, http, defineChain } from 'viem';
import { mainnet, sepolia, holesky } from 'viem/chains';
import { config } from '../config';

const anvil = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
});

/**
 * Get the chain configuration based on chain ID
 */
function getChain() {
  switch (config.CHAIN_ID) {
    case 1:
      return mainnet;
    case 11155111:
      return sepolia;
    case 17000:
      return holesky;
    case 31337:
      return anvil;
    default:
      throw new Error(`Unsupported chain ID: ${config.CHAIN_ID}`);
  }
}

/**
 * Create and return a public Viem client for reading contract data
 */
export function getPublicClient() {
  const chain = getChain();

  return createPublicClient({
    chain,
    transport: http(config.RPC_URL[0]),
  });
}
