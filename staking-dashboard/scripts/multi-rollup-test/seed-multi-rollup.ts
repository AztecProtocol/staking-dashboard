/**
 * Seed multi-rollup test state on anvil.
 *
 * Reads deploy-output.json (from deploy-multi-rollup.sh), then:
 * 1. Sets sequencer rewards via anvil_setStorageAt on both rollups
 * 2. Sets isRewardsClaimable = true via anvil_setStorageAt
 * 3. Writes contract_addresses.json (already done by deploy script, verified here)
 * 4. Writes test-data.json for Chrome MCP assertions
 *
 * Usage: npx tsx scripts/seed-multi-rollup.ts
 */

import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  keccak256,
  encodeAbiParameters,
  pad,
  toHex,
  numberToHex,
  stringToHex,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// Read deploy output
const deployOutput = JSON.parse(
  readFileSync(resolve(ROOT, "deploy-output.json"), "utf-8")
);

const rpcUrl = deployOutput.rpcUrl || "http://127.0.0.1:8545";

const publicClient = createPublicClient({
  chain: foundry,
  transport: http(rpcUrl),
});

const testClient = createTestClient({
  chain: foundry,
  mode: "anvil",
  transport: http(rpcUrl),
});

// Anvil account 0 for minting
const DEPLOYER_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as Hex;
const account = privateKeyToAccount(DEPLOYER_PK);
const walletClient = createWalletClient({
  account,
  chain: foundry,
  transport: http(rpcUrl),
});

const erc20Abi = parseAbi([
  "function mint(address _to, uint256 _amount) external",
]);

// Test addresses (anvil defaults)
const COINBASE_A = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;
const COINBASE_B = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as Address;

// ============================================================================
// Storage layout for RewardLib (namespaced storage)
//
// Base slot: keccak256("aztec.reward.storage")
//
// RewardStorage struct layout (relative to base):
//   slot 0: mapping(address => uint256) sequencerRewards
//   slot 1: mapping(Epoch => EpochRewards) epochRewards
//   slot 2: mapping(address => BitMap) proverClaimed
//   slot 3: RewardConfig.rewardDistributor (20 bytes) + RewardConfig.sequencerBps (4 bytes)
//   slot 4: RewardConfig.booster (20 bytes) + RewardConfig.checkpointReward (12 bytes)
//   slot 5: CompressedTimestamp earliestRewardsClaimableTimestamp + bool isRewardsClaimable
// ============================================================================

// In Solidity: keccak256("aztec.reward.storage") hashes raw UTF-8 bytes, NOT abi.encode
const REWARD_STORAGE_BASE = keccak256(stringToHex("aztec.reward.storage"));

// sequencerRewards mapping is at slot 0 relative to base
const SEQUENCER_REWARDS_SLOT = BigInt(REWARD_STORAGE_BASE);

// isRewardsClaimable is at slot 5 relative to base
// It's packed with earliestRewardsClaimableTimestamp
const IS_CLAIMABLE_SLOT = BigInt(REWARD_STORAGE_BASE) + 5n;

/**
 * Compute the storage slot for a mapping entry: keccak256(abi.encode(key, mappingSlot))
 */
function mappingSlot(key: Address, baseSlot: bigint): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }],
      [key, baseSlot]
    )
  );
}

async function setStorageSlot(
  contract: Address,
  slot: Hex,
  value: Hex
): Promise<void> {
  await testClient.setStorageAt({
    address: contract,
    index: slot,
    value: pad(value, { size: 32 }),
  });
}

// Rollup ABI for verification reads
const rollupAbi = [
  {
    type: "function",
    name: "getSequencerRewards",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRewardsClaimable",
    inputs: [],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVersion",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

async function main() {
  const rollupV1 = deployOutput.rollupV1Address as Address;
  const rollupV2 = deployOutput.rollupV2Address as Address;

  console.log(`\nSeeding multi-rollup test state...`);
  console.log(`  Rollup v1: ${rollupV1}`);
  console.log(`  Rollup v2: ${rollupV2}`);
  console.log(`  RPC:       ${rpcUrl}\n`);

  // ========================================
  // Set sequencer rewards on both rollups
  // ========================================
  console.log("Setting sequencer rewards...");

  // Rollup v1: coinbaseA = 5 TST, coinbaseB = 3 TST
  await setStorageSlot(
    rollupV1,
    mappingSlot(COINBASE_A, SEQUENCER_REWARDS_SLOT),
    numberToHex(5n * 10n ** 18n, { size: 32 })
  );
  await setStorageSlot(
    rollupV1,
    mappingSlot(COINBASE_B, SEQUENCER_REWARDS_SLOT),
    numberToHex(3n * 10n ** 18n, { size: 32 })
  );

  // Rollup v2: coinbaseA = 10 TST
  await setStorageSlot(
    rollupV2,
    mappingSlot(COINBASE_A, SEQUENCER_REWARDS_SLOT),
    numberToHex(10n * 10n ** 18n, { size: 32 })
  );

  // ========================================
  // Set isRewardsClaimable = true on both
  // ========================================
  console.log("Setting isRewardsClaimable = true...");

  // isRewardsClaimable is a bool packed at the end of slot 5.
  // The CompressedTimestamp is packed before it. We need to set the bool
  // without clobbering the timestamp. Since we just want the bool to be true,
  // we can set the entire slot to have the bool bit set.
  // CompressedTimestamp is bytes4 (offset 0), isRewardsClaimable is bool (offset 4)
  // Actually, let's read the current value and OR the bool in.
  for (const rollup of [rollupV1, rollupV2]) {
    const currentVal = await publicClient.getStorageAt({
      address: rollup,
      slot: numberToHex(IS_CLAIMABLE_SLOT, { size: 32 }),
    });
    // Set the 5th byte (offset 4) to 0x01 for true
    // Storage is right-aligned for simple types, so bool at offset 4 means byte 27 from left
    // Actually in Solidity packed storage, lower-offset items are at lower bytes.
    // CompressedTimestamp (4 bytes, offset 0) occupies bytes 0-3 from right
    // bool (1 byte, offset 4) occupies byte 4 from right
    const currentBigInt = BigInt(currentVal || "0x0");
    const withClaimable = currentBigInt | (1n << 32n); // Set bit at byte offset 4
    await setStorageSlot(
      rollup,
      numberToHex(IS_CLAIMABLE_SLOT, { size: 32 }),
      numberToHex(withClaimable, { size: 32 })
    );
  }

  // ========================================
  // Mint fee tokens to rollups (claimSequencerRewards transfers fee asset from rollup balance)
  // ========================================
  const feeAsset = deployOutput.feeAssetAddress as Address | undefined;
  if (feeAsset) {
    console.log("Minting fee tokens to rollups (needed for claim payouts)...");
    const mintAmount = 1000n * 10n ** 18n;
    for (const rollup of [rollupV1, rollupV2]) {
      const hash = await walletClient.writeContract({
        address: feeAsset,
        abi: erc20Abi,
        functionName: "mint",
        args: [rollup, mintAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash });
    }
    console.log("  Minted 1000 FEE to each rollup");
  } else {
    console.log("WARNING: feeAssetAddress not in deploy-output.json, claims may fail");
  }

  // ========================================
  // Verify
  // ========================================
  console.log("\nVerifying...");

  const v1RewardsA = await publicClient.readContract({
    address: rollupV1,
    abi: rollupAbi,
    functionName: "getSequencerRewards",
    args: [COINBASE_A],
  });
  console.log(
    `  Rollup v1 rewards for coinbaseA: ${v1RewardsA} (expected: ${5n * 10n ** 18n})`
  );
  if (v1RewardsA !== 5n * 10n ** 18n) {
    console.error("  ERROR: Reward mismatch!");
    process.exit(1);
  }

  const v1RewardsB = await publicClient.readContract({
    address: rollupV1,
    abi: rollupAbi,
    functionName: "getSequencerRewards",
    args: [COINBASE_B],
  });
  console.log(
    `  Rollup v1 rewards for coinbaseB: ${v1RewardsB} (expected: ${3n * 10n ** 18n})`
  );

  const v2RewardsA = await publicClient.readContract({
    address: rollupV2,
    abi: rollupAbi,
    functionName: "getSequencerRewards",
    args: [COINBASE_A],
  });
  console.log(
    `  Rollup v2 rewards for coinbaseA: ${v2RewardsA} (expected: ${10n * 10n ** 18n})`
  );

  const v1Claimable = await publicClient.readContract({
    address: rollupV1,
    abi: rollupAbi,
    functionName: "isRewardsClaimable",
  });
  console.log(`  Rollup v1 isRewardsClaimable: ${v1Claimable} (expected: true)`);

  const v2Claimable = await publicClient.readContract({
    address: rollupV2,
    abi: rollupAbi,
    functionName: "isRewardsClaimable",
  });
  console.log(`  Rollup v2 isRewardsClaimable: ${v2Claimable} (expected: true)`);

  // Read versions for test data
  const v1Version = await publicClient.readContract({
    address: rollupV1,
    abi: rollupAbi,
    functionName: "getVersion",
  });
  const v2Version = await publicClient.readContract({
    address: rollupV2,
    abi: rollupAbi,
    functionName: "getVersion",
  });

  // ========================================
  // Write test-data.json
  // ========================================
  const testData = {
    ...deployOutput,
    rollupV1Version: v1Version.toString(),
    rollupV2Version: v2Version.toString(),
    coinbaseA: COINBASE_A,
    coinbaseB: COINBASE_B,
    rollupV1Rewards: {
      [COINBASE_A]: (5n * 10n ** 18n).toString(),
      [COINBASE_B]: (3n * 10n ** 18n).toString(),
    },
    rollupV2Rewards: {
      [COINBASE_A]: (10n * 10n ** 18n).toString(),
    },
    rewardsClaimable: {
      [rollupV1]: v1Claimable,
      [rollupV2]: v2Claimable,
    },
  };

  writeFileSync(
    resolve(ROOT, "test-data.json"),
    JSON.stringify(testData, null, 2)
  );
  console.log("\nWrote test-data.json");

  // Print localStorage setup for the browser
  const DEPLOYER_ADDR = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const lsKey = `rewards_coinbase_addresses_${DEPLOYER_ADDR}`;
  const lsValue = JSON.stringify([COINBASE_A.toLowerCase()]);
  console.log("\nSeeding complete!");
  console.log("\n--- Browser setup (paste in DevTools console) ---");
  console.log(
    `localStorage.setItem('${lsKey}', '${lsValue}'); location.reload();`
  );
  console.log("---");
}

main().catch((err) => {
  console.error(`\nError: ${err.message}\n`);
  process.exit(1);
});
