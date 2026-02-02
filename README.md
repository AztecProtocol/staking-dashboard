# Aztec Staking Dashboard

A web application for staking Aztec Token Positions (ATP) on the Aztec network. This repository contains both the frontend dashboard and the backend indexer.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Staking Dashboard (React)                     │
│                     staking-dashboard/                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Wallet    │  │   Staking   │  │      Governance         │  │
│  │  Connect    │  │     UI      │  │       Voting            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                                      │
           │ RPC Calls                            │ REST API
           ▼                                      ▼
┌──────────────────┐                 ┌─────────────────────────────┐
│    Ethereum      │                 │     ATP Indexer (Ponder)    │
│    (Mainnet/     │◄────────────────│        atp-indexer/         │
│     Sepolia)     │   Event Sync    │  ┌─────────┐  ┌──────────┐  │
└──────────────────┘                 │  │ GraphQL │  │ Postgres │  │
                                     │  │   API   │  │    DB    │  │
                                     │  └─────────┘  └──────────┘  │
                                     └─────────────────────────────┘
```

## Prerequisites

- Node.js v20+
- Yarn package manager
- Docker (for running the indexer locally)
- Git

## Quick Start

### Frontend Only (connects to production indexer)

```bash
# Navigate to frontend
cd staking-dashboard

# Copy environment file
cp .env.example .env

# Edit .env and add your WalletConnect project ID
# Get one at https://cloud.walletconnect.com/

# Install dependencies and start
yarn install
yarn dev
```

The app will be available at http://localhost:5173

### Full Stack (frontend + local indexer)

```bash
# Terminal 1: Start the indexer
cd atp-indexer
cp .env.example .env
# Edit .env with your RPC URL and contract addresses
./bootstrap.sh dev

# Terminal 2: Start the frontend
cd staking-dashboard
cp .env.example .env
# Edit .env - set VITE_API_HOST=http://localhost:42068
yarn install
yarn dev
```

## Configuration

### Contract Addresses

Contract addresses can be provided via:

1. **Environment variables** (recommended for CI/CD)
2. **`CONTRACT_ADDRESSES_FILE`** environment variable pointing to a JSON file
3. **Local `contract_addresses.json`** file in the project directory

Example `contract_addresses.json`:
```json
{
  "atpFactory": "0x...",
  "atpFactoryAuction": "0x...",
  "atpRegistry": "0x...",
  "atpRegistryAuction": "0x...",
  "stakingRegistry": "0x...",
  "rollupAddress": "0x...",
  "atpWithdrawableAndClaimableStaker": "0x...",
  "genesisSequencerSale": "0x...",
  "governanceAddress": "0x...",
  "gseAddress": "0x...",
  "atpFactoryDeploymentBlock": "12345678"
}
```

For production contract addresses, see the [Aztec documentation](https://docs.aztec.network/) or contact the Aztec team.

## Project Structure

```
staking-dashboard/
├── .github/workflows/     # CI/CD workflows
├── staking-dashboard/     # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── contracts/     # Contract ABIs and addresses
│   │   └── lib/           # Utilities and helpers
│   ├── public/            # Static assets
│   ├── terraform/         # Infrastructure as code
│   └── bootstrap.sh       # Build and deploy script
├── atp-indexer/           # Backend Ponder indexer
│   ├── src/
│   │   ├── handlers/      # Event handlers
│   │   └── api/           # API routes
│   ├── scripts/           # Utility scripts
│   ├── terraform/         # Infrastructure as code
│   ├── ponder.config.ts   # Ponder configuration
│   ├── ponder.schema.ts   # Database schema
│   └── bootstrap.sh       # Build and deploy script
├── scripts/               # Shared scripts
│   └── logging.sh         # Logging utilities
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## Development

### Frontend (staking-dashboard/)

```bash
cd staking-dashboard

# Install dependencies
yarn install

# Start development server
yarn dev

# Type check
yarn tsc --noEmit

# Lint
yarn lint

# Build for production
yarn build
```

### Backend (atp-indexer/)

```bash
cd atp-indexer

# Install dependencies
yarn install

# Generate provider metadata
yarn bootstrap

# Generate Ponder types
yarn codegen

# Start development server
yarn dev
```

### Using Docker

```bash
# Frontend with Docker
cd staking-dashboard
./bootstrap.sh docker

# Indexer with Docker (includes PostgreSQL)
cd atp-indexer
docker compose up -d
```

## Governance

The staking dashboard supports governance voting for ATP holders. Key features:

- **Proposal creation**: Requires 258.75M tokens (2.5% of total supply)
- **Voting**: Vote YES or NO on active proposals
- **Delegation**: Delegate voting power to other addresses

See the [frontend README](staking-dashboard/README.md) for detailed governance testing instructions.

## Deployment

Deployments are managed via GitHub Actions:

- **`build.yaml`**: Runs on PRs to validate builds
- **`deploy-staking-dashboard.yaml`**: Deploys frontend to staging/prod
- **`deploy-indexer.yaml`**: Deploys indexer to staging/prod

### Manual Deployment

```bash
# Deploy frontend
cd staking-dashboard
./bootstrap.sh deploy-staging  # or deploy-prod

# Deploy indexer
cd atp-indexer
./bootstrap.sh deploy-staging  # or deploy-prod
```

Required environment variables for deployment:
- `AWS_ACCOUNT`, `AWS_REGION`
- `RPC_URL`, `CHAIN_ID`
- Contract addresses (see Configuration section)
- `WALLETCONNECT_PROJECT_ID`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Aztec Documentation](https://docs.aztec.network/)
- [Aztec Discord](https://discord.gg/aztec)
- [Aztec GitHub](https://github.com/AztecProtocol)
