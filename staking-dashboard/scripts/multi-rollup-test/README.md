# Multi-Rollup Integration Test

End-to-end test environment for verifying multi-rollup support (Issue #57). Deploys **real Aztec L1 contracts** to a local anvil chain with 2 rollup versions registered in the same Registry, then seeds reward state so the dashboard can discover and display per-rollup rewards.

## What it does

1. **Deploys the full Aztec L1 stack** via `DeployAztecL1Contracts.s.sol` from `aztec-packages/l1-contracts/` — Registry, GSE, Governance, Rollup v1, mock verifier, all the real contracts
2. **Deploys a second rollup** via `DeployRollupForUpgrade.s.sol` with a different `GENESIS_ARCHIVE_ROOT` (producing a different version hash)
3. **Registers rollup v2** in the Registry using `anvil_impersonateAccount` to impersonate Governance (which owns the Registry after handover)
4. **Deploys MockStakingRegistry** — the only mock contract. The real StakingRegistry isn't in `aztec-packages`; this one just returns `ROLLUP_REGISTRY()` and `STAKING_ASSET()`
5. **Seeds test state** via `anvil_setStorageAt` — sets sequencer rewards and `isRewardsClaimable` on both rollups using the real contract's namespaced storage layout
6. **Mints fee tokens** to both rollup contracts so `claimSequencerRewards` can actually transfer tokens
7. **Writes config files** (`contract_addresses.json`, `deploy-output.json`, `test-data.json`) for the frontend

## Prerequisites

- **Node.js 22+** and **yarn 1.22** (check `.tool-versions`)
- **Foundry** (forge, anvil, cast) — install via `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **yq** — `brew install yq` (needed to load network defaults)
- **aztec-packages** repo — set `AZTEC_PACKAGES_DIR` env var (auto-set by `.envrc` if aztec-packages is at `../aztec-packages/` relative to the staking-dashboard repo root)
- Frontend dependencies installed: `cd staking-dashboard && yarn install`
- MockStakingRegistry compiled: `cd staking-dashboard && forge build`

## Quick start

```bash
# 1. Start anvil
anvil --port 8545 &

# 2. Deploy contracts (takes ~2 min on first run due to Solidity compilation)
cd staking-dashboard
bash scripts/multi-rollup-test/deploy-multi-rollup.sh

# 3. Seed rewards + mint fee tokens
npx tsx scripts/multi-rollup-test/seed-multi-rollup.ts

# 4. Start frontend (reads contract_addresses.json via .env)
#    The .env should already exist from the deploy script, or run:
./bootstrap.sh dev
#    Then:
yarn dev
```

The frontend will be at `http://localhost:5173` with `VITE_ROLLUP_ADDRESS` pointing to rollup v1 (the old one), so `useRollupRegistry` will detect `isStale = true`.

## What to test

### Without wallet connection
- **Registry discovery**: the dashboard silently discovers 2 rollup versions via `useRollupRegistry`
- **Indexer disclaimer**: on `/providers`, the disclaimer "Historical statistics reflect the configured rollup only..." should appear (requires `rollups.length > 1`)

### With wallet connection (MetaMask + anvil)
Add anvil network to MetaMask: RPC `http://localhost:8545`, Chain ID `31337`. Import anvil account 0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`.

**Important — pre-populate coinbase address first.** The Claimable Rewards section is gated behind `hasStakedPositions`, which requires ATP staking events from the indexer. Since our test uses placeholder ATP factory addresses, no staking events are indexed and the section won't appear without this step.

Paste in the browser DevTools console (the seed script prints this exact line):
```js
localStorage.setItem('rewards_coinbase_addresses_0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', '["0x70997970c51812dc3a010c7d01b50e0d17dc79c8"]'); location.reload();
```

Then:
1. Navigate to **Positions** (`/my-position`)
2. Expand the **Claimable Rewards** card — should show **15 STK** total
3. Click **Claim All Rewards** — should show 2 tasks:
   - `0x7099...79C8 (rollup v{V1})` — **5 STK**
   - `0x7099...79C8 (rollup v{V2})` — **10 STK**
4. Each task targets a different rollup contract address in the transaction

**Before claiming**: reset MetaMask nonce — Settings → Advanced → **Clear activity tab data**. The deploy script creates many transactions, and MetaMask's cached nonce will be stale.

## Test data matrix

| Data Point | Rollup v1 (old, configured) | Rollup v2 (canonical) |
|---|---|---|
| `getVersion()` | auto-computed | different (different genesis) |
| `isRewardsClaimable()` | true | true |
| `getSequencerRewards(coinbaseA)` | 5e18 | 10e18 |
| `getSequencerRewards(coinbaseB)` | 3e18 | 0 |

- **coinbaseA**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (anvil account 1)
- **coinbaseB**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (anvil account 2)

## File outputs

| File | Purpose |
|------|---------|
| `deploy-output.json` | All deployed contract addresses + versions |
| `contract_addresses.json` | Format expected by `bootstrap.sh` — consumed by frontend `.env` generation |
| `test-data.json` | Expected values for assertions (rewards, versions, addresses) |

## Architecture

```
anvil (port 8545)
  ├── Real Registry (from aztec-packages)
  │     ├── Rollup v1 (version A) — VITE_ROLLUP_ADDRESS points here (deliberately stale)
  │     └── Rollup v2 (version B) — canonical
  ├── Real GSE, Governance, RewardDistributor, MockVerifier
  ├── MockStakingRegistry → points to real Registry + real staking token
  └── Real TestERC20 tokens (STK + FEE)

Frontend (port 5173)
  └── useRollupRegistry() discovers Registry → enumerates 2 rollups
        ├── useCoinbaseRewardsAcrossRollups() reads rewards from both
        └── useIsRewardsClaimableAcrossRollups() checks claimability on each
```

## Gotchas and troubleshooting

### MetaMask nonce errors ("nonce too low")
**Symptom**: Transactions fail with "Nonce provided for the transaction (N) is lower than the current nonce".

**Cause**: MetaMask caches nonces per account. After restarting anvil or redeploying, the chain nonce resets but MetaMask's cache is stale.

**Fix**: MetaMask → Settings → Advanced → **Clear activity tab data**. This resets the nonce cache.

### `claimSequencerRewards` reverts with `ERC20InsufficientBalance`
**Symptom**: Claim simulation fails. Error shows the Rollup contract has 0 balance of a token.

**Cause**: The real Rollup contract pays rewards by transferring **fee asset** (not staking asset) from its own balance. The seed script sets reward amounts in storage but doesn't give the Rollup any tokens to actually pay out.

**Fix**: The seed script now mints fee tokens to both rollup contracts. If you see this error, re-run: `npx tsx scripts/multi-rollup-test/seed-multi-rollup.ts`

### Multicall3 not deployed (wagmi `useReadContracts` fails silently)
**Symptom**: `useRollupRegistry` hook returns `rollups: []` even though `canonical` is populated. The stale banner may work but per-rollup features don't.

**Cause**: wagmi's `useReadContracts` uses Multicall3 (`0xcA11bde05977b3631167028862bE2a173976CA11`). Anvil doesn't deploy it by default. The `forge script --broadcast` command deploys it during the Aztec L1 deploy, but if anvil was restarted after deployment, it's gone.

**Fix**: The deploy script includes a Phase 0 that deploys Multicall3 via `anvil_setCode` using bytecode from the compiled `l1-contracts/out/Multicall3.sol/Multicall3.json`. If you restart anvil, re-run the deploy script.

### l1-contracts won't compile — missing `HonkVerifier.sol`
**Symptom**: `forge build` fails in `aztec-packages/l1-contracts/` with "Source not found: generated/HonkVerifier.sol".

**Cause**: The real HonkVerifier is generated from noir-projects circuit compilation. We use MockVerifier at runtime so the real one isn't needed, but the import still exists in test files.

**Fix**: The deploy script creates a placeholder automatically. If compiling manually:
```bash
cd aztec-packages/l1-contracts
mkdir -p generated
cat > generated/HonkVerifier.sol << 'EOF'
// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.27;
import {IVerifier} from "@aztec/core/interfaces/IVerifier.sol";
contract HonkVerifier is IVerifier {
    function verify(bytes calldata, bytes32[] calldata) external pure override returns (bool) { return true; }
}
EOF
yq -o json 'explode(.) | ."l1-contracts" // {}' ../spartan/environments/network-defaults.yml > generated/default.json
forge build
```

### Indexer shows "No Staking Positions Available"
**Symptom**: The Positions Overview with Claimable Rewards doesn't appear because `hasStakedPositions` is false.

**Cause**: The indexer watches for events from ATP factory contracts. Our test uses placeholder addresses for ATP factories, so no staking events are indexed.

**Fix**: Either run the indexer (it will still respond to API calls, just with empty data), or pre-populate coinbase addresses via localStorage as described above. The Claimable Rewards card renders once you have coinbase addresses saved, but the `hasStakedPositions` guard on the Positions Overview section may hide it.

### Storage slot calculation for rewards
The Rollup contract uses **namespaced storage** (ERC-7201 pattern). Reward data lives at:

```
base = keccak256("aztec.reward.storage")  // NOT abi.encode — raw UTF-8 bytes

RewardStorage layout (relative to base):
  slot 0: mapping(address => uint256) sequencerRewards
  slot 1: mapping(Epoch => EpochRewards) epochRewards
  slot 2: mapping(address => BitMap) proverClaimed
  slot 3-4: RewardConfig struct
  slot 5: CompressedTimestamp earliestRewardsClaimableTimestamp + bool isRewardsClaimable
```

For a mapping entry: `keccak256(abi.encode(address, base + 0))`.
For `isRewardsClaimable`: set bit at byte offset 4 (after the 4-byte CompressedTimestamp) at slot `base + 5`.

Common mistake: using `keccak256(abi.encode("aztec.reward.storage"))` (ABI-encoded string with offset+length) instead of `keccak256("aztec.reward.storage")` (raw bytes). The former produces a different hash and silently writes to the wrong slot.

### Governance owns the Registry — can't register rollup v2 directly
**Symptom**: `DeployRollupForUpgrade` deploys rollup v2 but doesn't auto-register it because `registry.owner() != deployer`.

**Cause**: `DeployAztecL1Contracts` transfers Registry ownership to Governance in `_handoverToGovernance()`. After that, only Governance can call `registry.addRollup()`.

**Fix**: The deploy script uses `anvil_impersonateAccount` to impersonate the Governance contract and call `addRollup`. This only works on anvil — on real networks you'd need to go through the governance proposal flow.
