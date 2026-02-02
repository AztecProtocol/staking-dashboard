import { ponder } from "ponder:registry";
import { provider, providerTakeRateUpdate } from "ponder:schema";

ponder.on("StakingRegistry:ProviderTakeRateUpdated", async ({ event, context }) => {
  const { providerIdentifier, newTakeRate } = event.args;
  const { db } = context;

  const providerRow = await db.find(provider, { providerIdentifier: providerIdentifier.toString() });
  const previousTakeRate = providerRow?.providerTakeRate ?? 0;

  await db.update(provider, { providerIdentifier: providerIdentifier.toString() }).set({ providerTakeRate: Number(newTakeRate) });

  await db.insert(providerTakeRateUpdate).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    providerIdentifier: providerIdentifier.toString(),
    newTakeRate: Number(newTakeRate),
    previousTakeRate,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Provider take rate updated: provider ${providerIdentifier}, ${previousTakeRate} → ${newTakeRate}`);
});
