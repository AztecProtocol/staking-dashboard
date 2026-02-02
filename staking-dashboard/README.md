# Aztec Staking Dashboard

A React-based web application that allows users to stake their ATP (Aztec Token Position).

## Quick Start

### Prerequisites

- Node.js v22.x.x
- Yarn package manager
- Git

### Option 1: Run with Sepolia config
The contracts are already deployed on Sepolia and we connect to them right away:

```bash
# 1. Navigate to staking dashboard folder
cd websites/staking-dashboard

# 2. Copy env variables (if .env doesn't exist yet)
cp .env.example .env

# 3. Fill in VITE_CONNECTWALLET_PROJECT_ID env variable

# 4. Install dependencies, copy contract addresses and ABIs
./bootstrap.sh sepolia
```


### Option 2: Run solely staking dashboard code
Run solely the staking dasboard react app.

```bash
# 1. Navigate to staking dashboard folder
cd websites/staking-dashboard

# 2. Copy env variables (if .env doesn't exist yet)
cp .env.example .env

# 3. Fill in VITE_CONNECTWALLET_PROJECT_ID env variable

# 4. Install dependencies
yarn 

# 5. Start developement server
yarn dev
```

## Governance

The staking dashboard supports governance voting for ATP holders. This section describes how to test the governance flow locally.

### Prerequisites

1. Start local Anvil node: `anvil`
2. Deploy contracts: `./bootstrap.sh` (from repo root)
3. Start the ATP indexer: `cd backends/atp-indexer && pnpm dev`

### Governance Scripts

Three scripts are available in the `scripts/` folder at the repo root:

| Script | Purpose |
|--------|---------|
| `governance_deposit.sh` | Deposit tokens from ATP into governance |
| `governance_propose.sh` | Create a governance proposal |
| `governance_vote.sh` | Vote on a governance proposal |

All scripts default to Anvil account 1. To use a different account, set the `PRIVATE_KEY` environment variable:
```bash
PRIVATE_KEY=0x... ./scripts/governance_vote.sh <atp_address> <proposal_id> <amount> <support>
```

### Complete Voting Flow Example

Uses Anvil account 1 (default for all scripts):

```bash
# Anvil account 1 (default)
ANVIL1_ADDR=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# 1. Create a test ATP with enough tokens (need 258.75M+ for proposals)
./scripts/mint_test_atp.sh $ANVIL1_ADDR 400000000

# 2. Get the ATP address from the indexer
ATP_ADDRESS=$(curl -s "http://localhost:42068/api/atp/beneficiary/$ANVIL1_ADDR" | jq -r '.data[0].address')

# 3. Deposit tokens into governance (handles upgrade, operator setup, approval)
./scripts/governance_deposit.sh $ATP_ADDRESS 300000000

# 4. Create a proposal
./scripts/governance_propose.sh $ATP_ADDRESS

# 5. Advance time past voting delay (dev config: 300 seconds)
cast rpc anvil_increaseTime 350 --rpc-url http://localhost:8545
cast rpc anvil_mine 1 --rpc-url http://localhost:8545

# 6. Vote on the proposal (20M tokens, YES vote)
./scripts/governance_vote.sh $ATP_ADDRESS 0 20000000 true
```

### Multi-Account Testing

The scripts support a `PRIVATE_KEY` environment variable for testing with different accounts:

```bash
# Anvil account 2
ANVIL2_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
ANVIL2_ADDR=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

# Mint ATP to account 2
./scripts/mint_test_atp.sh $ANVIL2_ADDR 400000000

# Get ATP address
ATP2=$(curl -s "http://localhost:42068/api/atp/beneficiary/$ANVIL2_ADDR" | jq -r '.data[0].address')

# Deposit and vote using account 2's private key
PRIVATE_KEY=$ANVIL2_KEY ./scripts/governance_deposit.sh $ATP2 300000000
PRIVATE_KEY=$ANVIL2_KEY ./scripts/governance_vote.sh $ATP2 0 20000000 true
```

### Verifying On-Chain Data

```bash
ANVIL1_ADDR=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
GOVERNANCE=$(jq -r '.governanceAddress' .contracts/dev/contract_addresses.json)

# Check proposal count
cast call $GOVERNANCE "proposalCount()(uint256)" --rpc-url http://localhost:8545

# Check proposal state (0=Pending, 1=Active, 2=Queued, 3=Executable, 4=Rejected)
cast call $GOVERNANCE "getProposalState(uint256)(uint8)" 0 --rpc-url http://localhost:8545

# Check a staker's ballot on a proposal
STAKER=$(curl -s "http://localhost:42068/api/atp/beneficiary/$ANVIL1_ADDR" | jq -r '.data[0].stakerAddress')
cast call $GOVERNANCE "getBallot(uint256,address)" 0 $STAKER --rpc-url http://localhost:8545
```

### Important Notes

- **Proposal threshold**: Creating a proposal requires 258.75M tokens (2.5% of total supply)
- **Voting delay**: Proposals must wait 300 seconds (dev config) before becoming Active
- **Power locking**: Creating a proposal locks your tokens until the proposal is resolved
- **Vote directions**: Use `true` for YES, `false` for NO
