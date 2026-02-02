import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { providerQueueDrip } from "ponder:schema";

ponder.on("StakingRegistry:ProviderQueueDripped", async ({ event, context }) => {
  const { providerIdentifier, attester } = event.args;
  const { db } = context;

  await db.insert(providerQueueDrip).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    providerIdentifier: providerIdentifier.toString(),
    attesterAddress: normalizeAddress(attester) as `0x${string}`,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Provider queue dripped: provider=${providerIdentifier}, attester=${attester}`);
});
