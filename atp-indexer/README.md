# Ponder Indexer

Blockchain indexer for Aztec staking dashboard.

## Installation

### Prerequisites

- Node.js >= 18.14
- PostgreSQL
- Yarn

### Setup

```bash
# Install dependencies
yarn install

# Generate provider metadata
yarn bootstrap

# Generate Ponder types
yarn codegen
```

### Run with Docker

```bash
# Start with Docker Compose
./bootstrap.sh docker sepolia

# Or with custom config
RPC_URL=https://your-rpc.com \
START_BLOCK=9341139 \
PORT=5001 \
./bootstrap.sh docker sepolia

# View logs
docker compose logs -f ponder

# Stop
docker compose down
```

## Scripts

- `./bootstrap.sh docker [env]` - Start with Docker Compose
- `./bootstrap.sh build` - Install deps & generate files
- `./bootstrap.sh clean` - Clean cache

Environments: `sepolia`, `mainnet`
