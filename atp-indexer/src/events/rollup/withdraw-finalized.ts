import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { withdrawFinalized } from "ponder:schema";

/**
 * Handle WithdrawFinalized event from Rollup contract
 * Records when a withdrawal is completed and funds are transferred
 */
ponder.on("Rollup:WithdrawFinalized", async ({ event, context }) => {
  const { attester, recipient, amount } = event.args;
  const { db } = context;

  await db.insert(withdrawFinalized).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    attesterAddress: normalizeAddress(attester) as `0x${string}`,
    recipientAddress: normalizeAddress(recipient) as `0x${string}`,
    rollupAddress: normalizeAddress(event.log.address) as `0x${string}`,
    amount,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  });

  console.log(
    `WithdrawFinalized: attester ${attester}, recipient ${recipient}, amount ${amount}`
  );
});
