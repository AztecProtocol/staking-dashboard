import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { stakerOperatorUpdate, atpPosition } from "ponder:schema";

ponder.on("ATP:StakerOperatorUpdated", async ({ event, context }) => {
  const { _operator } = event.args;
  const { db } = context;

  const atpAddress = normalizeAddress(event.log.address) as `0x${string}`;
  const newOperator = normalizeAddress(_operator) as `0x${string}`;

  const position = await db.find(atpPosition, { address: atpAddress });

  if (!position) {
    console.warn(`ATP position not found for atp ${atpAddress}, skipping operator update`);
    return;
  }

  const { stakerAddress, operatorAddress: previousOperator } = position;

  await db.update(atpPosition, { address: atpAddress }).set({ operatorAddress: newOperator });

  await db.insert(stakerOperatorUpdate).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    stakerAddress: stakerAddress as `0x${string}`,
    newOperator,
    previousOperator: previousOperator as `0x${string}` | null,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`Staker operator updated: staker=${stakerAddress}, ${previousOperator} → ${newOperator}`);
});
