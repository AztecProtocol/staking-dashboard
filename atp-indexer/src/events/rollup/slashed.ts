import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { slashed } from "ponder:schema";

/**
 * Handle Slashed event from Rollup contract
 * Records when an attester is slashed.
 *
 * Note: totalSlashed per stake is computed at query time by aggregating from
 * the slashed table, joined by attesterAddress. This avoids needing to update
 * the stake tables which would require non-primary-key lookups that Ponder's
 * event handler db API doesn't support.
 */
ponder.on("Rollup:Slashed", async ({ event, context }) => {
  const { attester, amount } = event.args;
  const { db } = context;
  const normalizedAttester = normalizeAddress(attester) as `0x${string}`;

  // Record the slashed event - totalSlashed will be computed at query time
  await db.insert(slashed).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    attesterAddress: normalizedAttester,
    rollupAddress: normalizeAddress(event.log.address) as `0x${string}`,
    amount,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  });

  console.log(
    `Slashed: attester ${attester}, amount ${amount}`
  );
});
