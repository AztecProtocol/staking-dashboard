import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { staked, atpPosition } from "ponder:schema";
import { getActivationThreshold } from "../../utils/rollup";

ponder.on("Staker:Staked", async ({ event, context }) => {
  const { staker, attester, rollup } = event.args;
  const { db, client } = context;

  const stakerAddress = normalizeAddress(staker) as `0x${string}`;

  // Find ATP position by staker address
  const atp = await db.sql.query.atpPosition.findFirst({
    where: (table, { eq }) => eq(atpPosition.stakerAddress, stakerAddress)
  })

  if (!atp) {
    console.warn(`ATP position not found for staker ${stakerAddress}, skipping Staked event`);
    return;
  }

  const activationThreshold = await getActivationThreshold(rollup, client);

  await db.insert(staked).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    atpAddress: normalizeAddress(atp.address) as `0x${string}`,
    stakerAddress,
    stakedAmount: BigInt(activationThreshold),
    operatorAddress: normalizeAddress(atp.operatorAddress || atp.address) as `0x${string}`,
    attesterAddress: normalizeAddress(attester) as `0x${string}`,
    rollupAddress: normalizeAddress(rollup) as `0x${string}`,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Staked (validator creation): staker=${stakerAddress}, operator=${atp.operatorAddress}, attester=${attester}, rollup=${rollup}`);
});
