import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { provider, providerRewardsRecipientUpdate } from "ponder:schema";

ponder.on("StakingRegistry:ProviderRewardsRecipientUpdated", async ({ event, context }) => {
  const { providerIdentifier, newRewardsRecipient } = event.args;
  const { db } = context;

  const providerRow = await db.find(provider, { providerIdentifier: providerIdentifier.toString() });
  const previousRewardsRecipient = providerRow?.rewardsRecipient;

  await db.update(provider, { providerIdentifier: providerIdentifier.toString() }).set({ rewardsRecipient: normalizeAddress(newRewardsRecipient) as `0x${string}` });

  await db.insert(providerRewardsRecipientUpdate).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    providerIdentifier: providerIdentifier.toString(),
    newRewardsRecipient: normalizeAddress(newRewardsRecipient) as `0x${string}`,
    previousRewardsRecipient: previousRewardsRecipient as `0x${string}` | null,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Provider rewards recipient updated: provider ${providerIdentifier}, ${previousRewardsRecipient} → ${newRewardsRecipient}`);
});
