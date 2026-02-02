import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { withdrawInitiated } from "ponder:schema";

/**
 * Handle WithdrawInitiated event from Rollup contract
 * Records when a withdrawal request is initiated by an attester
 */
ponder.on("Rollup:WithdrawInitiated", async ({ event, context }) => {
  const { attester, recipient, amount } = event.args;
  const { db } = context;

  await db.insert(withdrawInitiated).values({
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
    `WithdrawInitiated: attester ${attester}, recipient ${recipient}, amount ${amount}`
  );
});
