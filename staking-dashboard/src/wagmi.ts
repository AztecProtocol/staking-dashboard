import type { Chain } from "viem";
import { mainnet, sepolia } from "wagmi/chains";
import { defineChain, http } from "viem";
import { safe } from "wagmi/connectors";
import { createConfig } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "your-project-id";

const RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8545";

// Define Anvil local chain
const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
});

// Define custom Sepolia with custom RPC
const customSepolia = defineChain({
  ...sepolia,
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
});

// Overload rpc url for mainnet
const customMainnet = defineChain({
  ...mainnet,
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
});

// Get chains based on chain ID
const getChains = (): readonly [Chain, ...Chain[]] => {
  const chainId = Number(import.meta.env.VITE_CHAIN_ID);

  switch (chainId) {
    case 1:
      return [customMainnet];
    case 11155111:
      return [customSepolia];
    case 31337:
    default:
      return [anvilLocal];
  }
};

const chains = getChains();

const wallets = [
  {
    groupName: "Popular",
    wallets: [
      rainbowWallet,
      coinbaseWallet,
      metaMaskWallet,
      walletConnectWallet,
    ],
  },
];

const connectors = connectorsForWallets(wallets, {
  appName: "ATP Staking",
  projectId: WALLETCONNECT_PROJECT_ID,
});

export const config = createConfig({
  connectors: [...connectors, safe()],
  chains,
  transports: chains.reduce(
    (acc, chain) => {
      acc[chain.id] = http();
      return acc;
    },
    {} as Record<number, ReturnType<typeof http>>
  ),
  ssr: false,
});
