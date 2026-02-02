import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), '')

    const requiredEnvVars = [
      'VITE_API_HOST',
      'VITE_ATP_FACTORY_ADDRESS',
      'VITE_ATP_FACTORY_AUCTION_ADDRESS',
      'VITE_ATP_REGISTRY_ADDRESS',
      'VITE_ATP_REGISTRY_AUCTION_ADDRESS',
      'VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS',
      'VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS',
      'VITE_STAKING_REGISTRY_ADDRESS',
      'VITE_ROLLUP_ADDRESS',
      'VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS',
      'VITE_SAFE_API_KEY',
      'VITE_RPC_URL',
      'VITE_CHAIN_ID',
      'VITE_WALLETCONNECT_PROJECT_ID'
    ]

    const missingVars = requiredEnvVars.filter(varName => !env[varName])

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables for production build:\n${missingVars.map(v => `  - ${v}`).join('\n')}`
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts: mode === 'development'
        // For local dev tunneling purpose
        ? true
        : [
          "staking-dashboard-test.dashnode.org",
          "localhost",
          "127.0.0.1",
        ]
    },
  }
})
