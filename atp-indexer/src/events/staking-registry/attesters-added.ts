import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { providerAttester } from "ponder:schema";

ponder.on("StakingRegistry:AttestersAddedToProvider", async ({ event, context }) => {
  const { providerIdentifier, attesters } = event.args;
  const { db } = context;

  for (let i = 0; i < attesters.length; i++) {
    const attester = attesters[i];
    await db.insert(providerAttester).values({
      id: `${event.transaction.hash}-${event.log.logIndex}-${i}`,
      providerIdentifier: providerIdentifier.toString(),
      attesterAddress: normalizeAddress(attester) as `0x${string}`,
      blockNumber: event.block.number,
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      timestamp: event.block.timestamp,
    });
  }

  console.log(`Added ${attesters.length} attesters to provider ${providerIdentifier}`);
});
