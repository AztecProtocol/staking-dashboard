/**
 * Seed test providers by calling registerProvider() on the MockStakingRegistry.
 * This emits ProviderRegistered events that Ponder indexes, populating the
 * /api/providers endpoint.
 *
 * Usage: npx tsx scripts/multi-rollup-test/seed-providers.ts
 *
 * Prerequisites:
 *   - Anvil running with deployed MockStakingRegistry
 *   - deploy-output.json exists (from deploy-multi-rollup.sh)
 *   - Indexer running (will pick up events in real-time)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const INDEXER_ROOT = resolve(ROOT, "../atp-indexer");

// Read deploy output
const deployOutput = JSON.parse(
  readFileSync(resolve(ROOT, "deploy-output.json"), "utf-8")
);
const rpcUrl = deployOutput.rpcUrl || "http://127.0.0.1:8545";
const mockSR = deployOutput.mockStakingRegistryAddress as Address;

// Read provider metadata to know which IDs to register
const providersJson = JSON.parse(
  readFileSync(resolve(INDEXER_ROOT, "src/api/data/providers.json"), "utf-8")
) as Array<{ providerId: number; providerName: string }>;

const DEPLOYER_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as Hex;
const account = privateKeyToAccount(DEPLOYER_PK);

const publicClient = createPublicClient({
  chain: foundry,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: foundry,
  transport: http(rpcUrl),
});

const registerAbi = parseAbi([
  "function registerProvider(uint256 _providerIdentifier, address _providerAdmin, uint16 _takeRate, address _rewardsRecipient) external",
]);

async function main() {
  // Register first 10 providers from metadata
  const toRegister = providersJson.slice(0, 10);

  console.log(`\nRegistering ${toRegister.length} test providers on MockStakingRegistry...`);
  console.log(`  MockStakingRegistry: ${mockSR}`);
  console.log(`  RPC: ${rpcUrl}\n`);

  for (const p of toRegister) {
    const hash = await walletClient.writeContract({
      address: mockSR,
      abi: registerAbi,
      functionName: "registerProvider",
      args: [
        BigInt(p.providerId),
        account.address,    // providerAdmin
        500,                // 5% take rate (basis points / 100)
        account.address,    // rewardsRecipient
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  Registered provider ${p.providerId} (${p.providerName})`);
  }

  console.log(`\nDone! The indexer should pick up ProviderRegistered events automatically.`);
  console.log(`Check: curl http://localhost:42068/api/providers | jq '.providers | length'`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}\n`);
  process.exit(1);
});
