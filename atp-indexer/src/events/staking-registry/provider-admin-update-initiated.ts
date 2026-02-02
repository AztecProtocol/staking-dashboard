import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { providerAdminUpdateInitiated } from "ponder:schema";

ponder.on("StakingRegistry:ProviderAdminUpdateInitiated", async ({ event, context }) => {
  const { providerIdentifier, newAdmin } = event.args;
  const { db } = context;

  await db.insert(providerAdminUpdateInitiated).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    providerIdentifier: providerIdentifier.toString(),
    newAdmin: normalizeAddress(newAdmin) as `0x${string}`,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Provider admin update initiated: provider ${providerIdentifier}, new admin=${newAdmin}`);
});
