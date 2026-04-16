#!/bin/bash
set -euo pipefail

# Deploy real Aztec L1 contracts with 2 rollup versions on local anvil.
# Uses DeployAztecL1Contracts for v1, DeployRollupForUpgrade for v2,
# then anvil_impersonateAccount to register v2 in the Registry.
#
# Required env vars:
#   AZTEC_PACKAGES_DIR — path to aztec-packages repo root
#
# Optional env vars:
#   ANVIL_PORT         — anvil port (default: 8545)
#   DEPLOYER_PK        — deployer private key (default: anvil account 0)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STAKING_ROOT="$SCRIPT_DIR/../.."

# Resolve L1 contracts directory
if [ -z "${AZTEC_PACKAGES_DIR:-}" ]; then
  echo "ERROR: AZTEC_PACKAGES_DIR is not set."
  echo "Set it to the aztec-packages repo root, e.g.:"
  echo "  export AZTEC_PACKAGES_DIR=/path/to/aztec-packages"
  exit 1
fi
L1_ROOT="$AZTEC_PACKAGES_DIR/l1-contracts"
if [ ! -d "$L1_ROOT/src" ]; then
  echo "ERROR: $L1_ROOT/src not found. Is AZTEC_PACKAGES_DIR correct?"
  exit 1
fi

# Clean stale output files (prevents race conditions with seed/frontend scripts)
rm -f "$STAKING_ROOT/deploy-output.json" "$STAKING_ROOT/test-data.json"

ANVIL_PORT="${ANVIL_PORT:-8545}"
L1_RPC_URL="http://127.0.0.1:$ANVIL_PORT"
DEPLOYER_PK="${DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

echo "=== Loading devnet defaults ==="
source "$L1_ROOT/scripts/load_network_defaults.sh" devnet 2>/dev/null

export L1_RPC_URL
export ROLLUP_DEPLOYMENT_PRIVATE_KEY="$DEPLOYER_PK"
export REAL_VERIFIER=false

# Ensure l1-contracts are compiled
echo "=== Ensuring l1-contracts are compiled ==="
cd "$L1_ROOT"
mkdir -p generated
if [ ! -f generated/HonkVerifier.sol ]; then
  cat > generated/HonkVerifier.sol << 'SOLEOF'
// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.27;
import {IVerifier} from "@aztec/core/interfaces/IVerifier.sol";
contract HonkVerifier is IVerifier {
    function verify(bytes calldata, bytes32[] calldata) external pure override returns (bool) { return true; }
}
SOLEOF
fi
if [ ! -f generated/default.json ]; then
  yq -o json 'explode(.) | ."l1-contracts" // {}' "$AZTEC_PACKAGES_DIR/spartan/environments/network-defaults.yml" > generated/default.json 2>/dev/null || true
fi
forge build 2>/dev/null

# Clean stale broadcasts
rm -rf broadcast/

# ======================================
# Phase 0: Deploy Multicall3 (required by wagmi useReadContracts)
# ======================================
echo ""
echo "=== Phase 0: Deploying Multicall3 ==="
MULTICALL3_BYTECODE=$(jq -r '.deployedBytecode.object' "$L1_ROOT/out/Multicall3.sol/Multicall3.json" 2>/dev/null)
if [ -n "$MULTICALL3_BYTECODE" ] && [ "$MULTICALL3_BYTECODE" != "null" ]; then
  cast rpc anvil_setCode "0xcA11bde05977b3631167028862bE2a173976CA11" "$MULTICALL3_BYTECODE" --rpc-url "$L1_RPC_URL" > /dev/null
  echo "  Multicall3 deployed at 0xcA11bde05977b3631167028862bE2a173976CA11"
else
  echo "  WARNING: Multicall3 bytecode not found — wagmi useReadContracts may fail"
fi

# ======================================
# Phase 1: Deploy full L1 stack + rollup v1
# ======================================
echo ""
echo "=== Phase 1: Deploying L1 contracts + Rollup v1 ==="
node "$L1_ROOT/scripts/forge_broadcast.js" \
  script/deploy/DeployAztecL1Contracts.s.sol:DeployAztecL1Contracts \
  --rpc-url "$L1_RPC_URL" \
  --private-key "$DEPLOYER_PK" \
  --json > /tmp/deploy_v1.jsonl

DEPLOY_JSON=$(head -1 /tmp/deploy_v1.jsonl | jq -r '.logs[0]' | sed 's/JSON DEPLOY RESULT: //')

REGISTRY=$(echo "$DEPLOY_JSON" | jq -r '.registryAddress')
ROLLUP_V1=$(echo "$DEPLOY_JSON" | jq -r '.rollupAddress')
STAKING_ASSET=$(echo "$DEPLOY_JSON" | jq -r '.stakingAssetAddress')
FEE_ASSET=$(echo "$DEPLOY_JSON" | jq -r '.feeAssetAddress')
GOVERNANCE=$(echo "$DEPLOY_JSON" | jq -r '.governanceAddress')
GSE_ADDR=$(echo "$DEPLOY_JSON" | jq -r '.gseAddress')
REWARD_DIST=$(echo "$DEPLOY_JSON" | jq -r '.rewardDistributorAddress')
V1_VERSION=$(echo "$DEPLOY_JSON" | jq -r '.rollupVersion')

echo "  Registry:       $REGISTRY"
echo "  Rollup v1:      $ROLLUP_V1  (version: $V1_VERSION)"
echo "  Staking Asset:  $STAKING_ASSET"
echo "  Governance:     $GOVERNANCE"

# ======================================
# Phase 2: Deploy rollup v2 with different genesis
# ======================================
echo ""
echo "=== Phase 2: Deploying Rollup v2 ==="

# Different genesis → different version hash
export GENESIS_ARCHIVE_ROOT="0x$(openssl rand -hex 32)"
export REGISTRY_ADDRESS="$REGISTRY"

node "$L1_ROOT/scripts/forge_broadcast.js" \
  script/deploy/DeployRollupForUpgrade.s.sol:DeployRollupForUpgrade \
  --rpc-url "$L1_RPC_URL" \
  --private-key "$DEPLOYER_PK" \
  --json > /tmp/deploy_v2.jsonl

DEPLOY_V2_JSON=$(head -1 /tmp/deploy_v2.jsonl | jq -r '.logs[0]' | sed 's/JSON DEPLOY RESULT: //')
ROLLUP_V2=$(echo "$DEPLOY_V2_JSON" | jq -r '.rollupAddress')
V2_VERSION=$(echo "$DEPLOY_V2_JSON" | jq -r '.rollupVersion')

echo "  Rollup v2:      $ROLLUP_V2  (version: $V2_VERSION)"

# ======================================
# Phase 3: Register rollup v2 in Registry via anvil impersonation
# ======================================
echo ""
echo "=== Phase 3: Registering Rollup v2 in Registry ==="

# Governance owns the Registry after handover. Impersonate it on anvil.
cast rpc anvil_impersonateAccount "$GOVERNANCE" --rpc-url "$L1_RPC_URL" > /dev/null
cast rpc anvil_setBalance "$GOVERNANCE" "0xDE0B6B3A7640000" --rpc-url "$L1_RPC_URL" > /dev/null

cast send "$REGISTRY" "addRollup(address)" "$ROLLUP_V2" \
  --from "$GOVERNANCE" --rpc-url "$L1_RPC_URL" --unlocked > /dev/null

cast rpc anvil_stopImpersonatingAccount "$GOVERNANCE" --rpc-url "$L1_RPC_URL" > /dev/null

# Also register v2 in GSE
cast rpc anvil_impersonateAccount "$GOVERNANCE" --rpc-url "$L1_RPC_URL" > /dev/null
cast send "$GSE_ADDR" "addRollup(address)" "$ROLLUP_V2" \
  --from "$GOVERNANCE" --rpc-url "$L1_RPC_URL" --unlocked > /dev/null 2>&1 || true
cast rpc anvil_stopImpersonatingAccount "$GOVERNANCE" --rpc-url "$L1_RPC_URL" > /dev/null

# Verify
NUM_VERSIONS=$(cast call "$REGISTRY" "numberOfVersions()(uint256)" --rpc-url "$L1_RPC_URL")
echo "  Registered rollup versions: $NUM_VERSIONS"

CANONICAL=$(cast call "$REGISTRY" "getCanonicalRollup()(address)" --rpc-url "$L1_RPC_URL")
echo "  Canonical rollup: $CANONICAL"

# ======================================
# Phase 4: Deploy MockStakingRegistry
# ======================================
echo ""
echo "=== Phase 4: Deploying MockStakingRegistry ==="
cd "$STAKING_ROOT"
forge build 2>/dev/null

MOCK_BYTECODE=$(jq -r '.bytecode.object' contracts/out/MockStakingRegistry.sol/MockStakingRegistry.json)
ENCODED_ARGS=$(cast abi-encode "constructor(address,address,address)" "$REGISTRY" "$STAKING_ASSET" "0x0000000000000000000000000000000000000000")
DEPLOY_DATA="${MOCK_BYTECODE}${ENCODED_ARGS:2}"

MOCK_TX=$(cast send \
  --private-key "$DEPLOYER_PK" \
  --rpc-url "$L1_RPC_URL" \
  --create "$DEPLOY_DATA" \
  --json 2>/dev/null)
MOCK_SR_ADDR=$(echo "$MOCK_TX" | jq -r '.contractAddress')
echo "  MockStakingRegistry: $MOCK_SR_ADDR"

# ======================================
# Phase 5: Write output files
# ======================================
echo ""
echo "=== Writing output files ==="

cat > "$STAKING_ROOT/deploy-output.json" << EOJSON
{
  "registryAddress": "$REGISTRY",
  "rollupV1Address": "$ROLLUP_V1",
  "rollupV1Version": "$V1_VERSION",
  "rollupV2Address": "$ROLLUP_V2",
  "rollupV2Version": "$V2_VERSION",
  "stakingAssetAddress": "$STAKING_ASSET",
  "feeAssetAddress": "$FEE_ASSET",
  "mockStakingRegistryAddress": "$MOCK_SR_ADDR",
  "governanceAddress": "$GOVERNANCE",
  "gseAddress": "$GSE_ADDR",
  "rewardDistributorAddress": "$REWARD_DIST",
  "rpcUrl": "$L1_RPC_URL"
}
EOJSON

echo "  deploy-output.json written"

cat > "$STAKING_ROOT/contract_addresses.json" << EOJSON
{
  "atpFactory": "0x0000000000000000000000000000000000000001",
  "atpFactoryAuction": "0x0000000000000000000000000000000000000002",
  "atpRegistry": "0x0000000000000000000000000000000000000003",
  "atpRegistryAuction": "0x0000000000000000000000000000000000000004",
  "stakingRegistry": "$MOCK_SR_ADDR",
  "rollupAddress": "$ROLLUP_V1",
  "atpWithdrawableAndClaimableStaker": "0x0000000000000000000000000000000000000005",
  "genesisSequencerSale": "0x0000000000000000000000000000000000000006",
  "governanceAddress": "$GOVERNANCE",
  "gseAddress": "$GSE_ADDR"
}
EOJSON

echo "  contract_addresses.json written (VITE_ROLLUP_ADDRESS = rollup v1, deliberately stale)"

echo ""
echo "=== Deployment complete ==="
echo "  Rollup v1 (old/configured): $ROLLUP_V1 (v$V1_VERSION)"
echo "  Rollup v2 (canonical):      $ROLLUP_V2 (v$V2_VERSION)"
echo "  Registry:                   $REGISTRY ($NUM_VERSIONS versions)"
echo "  MockStakingRegistry:        $MOCK_SR_ADDR"
echo ""
echo "Next: npx tsx scripts/multi-rollup-test/seed-multi-rollup.ts"
