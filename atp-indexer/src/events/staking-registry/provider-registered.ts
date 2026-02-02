import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { getProviderConfiguration } from "../../utils/staking-registry";
import { provider } from "ponder:schema";

/**
 * Handle ProviderRegistered event
 * Creates a new provider record with initial configuration
 */
ponder.on("StakingRegistry:ProviderRegistered", async ({ event, context }) => {
  const { providerIdentifier, providerAdmin, providerTakeRate } = event.args;
  const { client, db } = context;

  // Get provider rewards recipient from contract
  const { providerRewardsRecipient } = await getProviderConfiguration(
    providerIdentifier,
    client,
    event.block.number
  );

  await db.insert(provider).values({
    id: providerIdentifier.toString(),
    providerIdentifier: providerIdentifier.toString(),
    providerAdmin: normalizeAddress(providerAdmin) as `0x${string}`,
    providerTakeRate: Number(providerTakeRate),
    rewardsRecipient: normalizeAddress(providerRewardsRecipient) as `0x${string}`,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(
    `Provider registered: ${providerIdentifier}, admin ${providerAdmin}, take rate ${providerTakeRate}`
  );
});
