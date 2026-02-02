import { ponder } from "ponder:registry";
import { normalizeAddress } from "../../utils/address";
import { tokensWithdrawnToBeneficiary, atpPosition } from "ponder:schema";

ponder.on("ATP:Claimed", async ({ event, context }) => {
  try {
    const { amount } = event.args;
    const { db } = context;

    const atpAddress = normalizeAddress(event.log.address) as `0x${string}`;

    // Find the ATP to get beneficiary and staker address
    const atp = await db.find(atpPosition, { address: atpAddress });

    if (!atp) {
      console.error(`ATP position not found for ATP ${atpAddress}`);
      throw new Error(`ATP position not found for ATP ${atpAddress}`);
    }

    // Insert into same table as NCATP withdrawals for unified tracking
    await db.insert(tokensWithdrawnToBeneficiary).values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      stakerAddress: atp.stakerAddress as `0x${string}`,
      atpAddress,
      beneficiary: atp.beneficiary as `0x${string}`,
      amount,
      txHash: event.transaction.hash,
      blockNumber: event.block.number,
      logIndex: event.log.logIndex,
      timestamp: event.block.timestamp,
    });

    console.log(`ATP:Claimed: ${amount} from ATP ${atpAddress}`);
  } catch (error) {
    console.error(`Failed to process ATP:Claimed event:`, {
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
});
