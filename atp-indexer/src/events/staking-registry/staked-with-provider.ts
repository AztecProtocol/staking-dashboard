import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { getActivationThreshold } from "../../utils/rollup";
import { stakedWithProvider, erc20StakedWithProvider, atpPosition, provider } from "ponder:schema";

ponder.on("StakingRegistry:StakedWithProvider", async ({ event, context }) => {
  try {
    const {
      providerIdentifier,
      rollupAddress,
      attester,
      coinbaseSplitContractAddress,
      stakerAddress: _stakerAddress,
    } = event.args;
    const { client, db } = context;

    const stakerAddress = normalizeAddress(_stakerAddress) as `0x${string}`;

    // Find ATP position by staker address
    const atp = await db.sql.query.atpPosition.findFirst({
      where: (table, {eq}) => eq(atpPosition.stakerAddress, stakerAddress)
    })

    // Get activation threshold and provider config (needed for both paths)
    const activationThreshold = await getActivationThreshold(rollupAddress, client);

    const providerConfig = await db.find(provider, { providerIdentifier: providerIdentifier.toString() });
    if (!providerConfig) {
      console.error(`Provider ${providerIdentifier} not found - skipping stake`, {
        txHash: event.transaction.hash,
        logIndex: event.log.logIndex
      });
      return; // Don't throw - provider config is metadata, not critical financial data
    }

    // Branch based on whether ATP exists
    if (atp) {
      // ATP-based staking - insert into stakedWithProvider
      await db.insert(stakedWithProvider).values({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        atpAddress: normalizeAddress(atp.address) as `0x${string}`,
        stakerAddress,
        operatorAddress: normalizeAddress(atp.operatorAddress || atp.address) as `0x${string}`,
        splitContractAddress: normalizeAddress(coinbaseSplitContractAddress) as `0x${string}`,
        providerIdentifier: providerIdentifier.toString(),
        rollupAddress: normalizeAddress(rollupAddress) as `0x${string}`,
        attesterAddress: normalizeAddress(attester) as `0x${string}`,
        stakedAmount: BigInt(activationThreshold),
        providerTakeRate: providerConfig.providerTakeRate,
        providerRewardsRecipient: providerConfig.rewardsRecipient,
        txHash: event.transaction.hash,
        blockNumber: event.block.number,
        logIndex: event.log.logIndex,
        timestamp: event.block.timestamp,
      });
    } else {
      // ERC20 direct staking - insert into erc20StakedWithProvider
      await db.insert(erc20StakedWithProvider).values({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        stakerAddress,
        splitContractAddress: normalizeAddress(coinbaseSplitContractAddress) as `0x${string}`,
        providerIdentifier: providerIdentifier.toString(),
        rollupAddress: normalizeAddress(rollupAddress) as `0x${string}`,
        attesterAddress: normalizeAddress(attester) as `0x${string}`,
        stakedAmount: BigInt(activationThreshold),
        providerTakeRate: providerConfig.providerTakeRate,
        providerRewardsRecipient: providerConfig.rewardsRecipient,
        txHash: event.transaction.hash,
        blockNumber: event.block.number,
        logIndex: event.log.logIndex,
        timestamp: event.block.timestamp,
      });
    }
  } catch (error) {
    console.error(`Failed to process StakingRegistry:StakedWithProvider event:`, {
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
});
