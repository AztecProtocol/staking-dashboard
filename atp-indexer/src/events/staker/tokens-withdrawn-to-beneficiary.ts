import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { tokensWithdrawnToBeneficiary, atpPosition } from "ponder:schema";

ponder.on("Staker:TokensWithdrawnToBeneficiary", async ({ event, context }) => {
  try {
    const { beneficiary, amount } = event.args;
    const { db } = context;

    const stakerAddress = normalizeAddress(event.log.address) as `0x${string}`;

    // Find the ATP associated with this staker
    const atp = await db.sql.query.atpPosition.findFirst({
      where: (table, { eq }) => eq(atpPosition.stakerAddress, stakerAddress)
    });

    if (!atp) {
      console.error(`ATP position not found for staker ${stakerAddress}`);
      throw new Error(`ATP position not found for staker ${stakerAddress}`);
    }

    await db.insert(tokensWithdrawnToBeneficiary).values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      stakerAddress,
      atpAddress: atp.address,
      beneficiary: normalizeAddress(beneficiary) as `0x${string}`,
      amount,
      txHash: event.transaction.hash,
      blockNumber: event.block.number,
      logIndex: event.log.logIndex,
      timestamp: event.block.timestamp,
    });

    console.log(`TokensWithdrawnToBeneficiary: ${amount} to ${beneficiary} from staker ${stakerAddress}`);
  } catch (error) {
    console.error(`Failed to process Staker:TokensWithdrawnToBeneficiary event:`, {
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
});
