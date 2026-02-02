import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { provider, providerAdminUpdated } from "ponder:schema";

ponder.on("StakingRegistry:ProviderAdminUpdated", async ({ event, context }) => {
  const { providerIdentifier, newAdmin } = event.args;
  const { db } = context;

  const providerRow = await db.find(provider, { providerIdentifier: providerIdentifier.toString() });
  const previousAdmin = providerRow?.providerAdmin;

  await db.update(provider, { providerIdentifier: providerIdentifier.toString() }).set({ providerAdmin: normalizeAddress(newAdmin) as `0x${string}` });

  await db.insert(providerAdminUpdated).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    providerIdentifier: providerIdentifier.toString(),
    newAdmin: normalizeAddress(newAdmin) as `0x${string}`,
    previousAdmin: previousAdmin as `0x${string}` | null,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Provider admin updated: provider ${providerIdentifier} → ${newAdmin}`);
});
