import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { deposit } from "ponder:schema";

/**
 * Handle Deposit event from Rollup contract
 * Records successful validator deposits with BLS keys
 */
ponder.on("Rollup:Deposit", async ({ event, context }) => {
  const { attester, withdrawer, publicKeyInG1, publicKeyInG2, proofOfPossession, amount } =
    event.args;
  const { db } = context;

  await db.insert(deposit).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    attesterAddress: normalizeAddress(attester) as `0x${string}`,
    withdrawerAddress: normalizeAddress(withdrawer) as `0x${string}`,
    rollupAddress: normalizeAddress(event.log.address) as `0x${string}`,
    publicKeyG1X: publicKeyInG1.x,
    publicKeyG1Y: publicKeyInG1.y,
    publicKeyG2X0: publicKeyInG2.x0,
    publicKeyG2X1: publicKeyInG2.x1,
    publicKeyG2Y0: publicKeyInG2.y0,
    publicKeyG2Y1: publicKeyInG2.y1,
    proofOfPossessionX: proofOfPossession.x,
    proofOfPossessionY: proofOfPossession.y,
    amount,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(
    `Deposit recorded: attester ${attester}, withdrawer ${withdrawer}, amount ${amount}`
  );
});
