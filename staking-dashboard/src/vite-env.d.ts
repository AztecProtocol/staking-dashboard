/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ATP_FACTORY_ADDRESS: string
  readonly VITE_ATP_FACTORY_AUCTION_ADDRESS: string
  readonly VITE_ATP_REGISTRY_ADDRESS: string
  readonly VITE_ATP_REGISTRY_AUCTION_ADDRESS: string
  readonly VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS: string
  readonly VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS: string
  readonly VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS: string
  readonly VITE_STAKING_REGISTRY_ADDRESS: string
  readonly VITE_ROLLUP_ADDRESS: string
  readonly VITE_GENESIS_SEQUENCER_SALE_ADDRESS: string
  readonly VITE_GOVERNANCE_ADDRESS: string
  readonly VITE_GSE_ADDRESS: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_RPC_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_EXPLORER_URL: string
  readonly VITE_API_HOST: string
  readonly VITE_SAFE_API_KEY: string
  readonly VITE_VALIDATOR_DASHBOARD_URL: string
  // Network switcher
  readonly VITE_CURRENT_NETWORK?: "mainnet" | "testnet"
  readonly VITE_MAINNET_URL?: string
  readonly VITE_TESTNET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
