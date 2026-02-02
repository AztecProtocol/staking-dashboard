import { IndexingFunctionArgs, ponder } from "ponder:registry";
import { ATPType } from "../../abis/atp.abi";
import { ATP_GET_TYPE_ABI, ATP_GET_STAKER_ABI } from "../../abis";
import { normalizeAddress } from "../../utils/address";
import { atpPosition } from "ponder:schema";

/**
 * Determine ATP type by calling getType() on the ATP contract
 */
async function determineATPType(
  atpAddress: `0x${string}`,
  client: any
): Promise<"MATP" | "LATP" | "NCATP" | "Unknown"> {
  try {
    const typeValue = await client.readContract({
      address: atpAddress,
      abi: ATP_GET_TYPE_ABI,
      functionName: "getType",
    });

    if (typeValue === ATPType.Linear) {
      return "LATP";
    } else if (typeValue === ATPType.Milestone) {
      return "MATP";
    } else if (typeValue === ATPType.NonClaim) {
      return "NCATP";
    }
    return "Unknown";
  } catch (error) {
    console.error(`Failed to determine ATP type for ${atpAddress}:`, error);
    return "Unknown";
  }
}

/**
 * Get staker address by calling getStaker() on the ATP contract
 */
async function getStakerAddress(
  atpAddress: `0x${string}`,
  client: any
): Promise<string> {
  try {
    const stakerAddress = await client.readContract({
      address: atpAddress,
      abi: ATP_GET_STAKER_ABI,
      functionName: "getStaker",
    });

    return stakerAddress as string;
  } catch (error) {
    console.error(`Failed to get staker address for ${atpAddress}:`, error);
    return atpAddress;
  }
}

/**
 * Shared handler for ATPCreated event
 */
async function handleATPCreated({ event, context }: IndexingFunctionArgs<'ATPFactory:ATPCreated'>, source: string) {
  const { beneficiary, atp, allocation } = event.args;
  const { client, db } = context;

  const atpType = await determineATPType(atp, client);
  const stakerAddress = await getStakerAddress(atp, client);

  await db.insert(atpPosition).values({
    id: normalizeAddress(atp),
    address: normalizeAddress(atp) as `0x${string}`,
    beneficiary: normalizeAddress(beneficiary) as `0x${string}`,
    allocation,
    type: atpType,
    stakerAddress: normalizeAddress(stakerAddress) as `0x${string}`,
    operatorAddress: null,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    timestamp: event.block.timestamp,
  })

  console.log(`${atpType} created (${source}): ${atp}`);
}

ponder.on("ATPFactory:ATPCreated", async (params) => {
  await handleATPCreated(params, "factory");
});

ponder.on("ATPFactoryAuction:ATPCreated", async (params) => {
  await handleATPCreated(params, "auction");
});
