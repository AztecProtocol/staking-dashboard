import { usePublicClient } from "wagmi";
import { useCallback } from "react";
import { contracts } from "../../contracts";
import { parseAbiItem, type Address, type GetLogsReturnType } from "viem";

const atpCreatedEvent = parseAbiItem(
  "event ATPCreated(address indexed beneficiary, address indexed atp, uint256 allocation)",
);

type ATPCreatedEvent = GetLogsReturnType<typeof atpCreatedEvent>[0];

export function useATPCreatedEvents(beneficiaryAddress?: Address) {
  const publicClient = usePublicClient();

  const getATPCreatedLogs = useCallback(async () => {
    if (!beneficiaryAddress || !publicClient) return [];

    try {
      const blockNumber = await publicClient.getBlockNumber();

      // We are scanning for ATPCreated events up until 200000 blocks in history.
      // TODO: This is just for debugging. We will have use some event indexing service in production
      const CHUNK_SIZE = 50000n;
      const MAX_BLOCKS_BACK = 200000n;
      const startBlock = blockNumber;
      const endBlock =
        blockNumber > MAX_BLOCKS_BACK ? blockNumber - MAX_BLOCKS_BACK : 0n;

      let userLogs: ATPCreatedEvent[] = [];

      // Fetch events in chunks going backwards in history to avoid RPC limits
      for (
        let toBlock = startBlock;
        toBlock >= endBlock;
        toBlock -= CHUNK_SIZE
      ) {
        const fromBlock =
          toBlock - CHUNK_SIZE + 1n < endBlock
            ? endBlock
            : toBlock - CHUNK_SIZE + 1n;

        try {
          const chunkUserLogs = await publicClient.getLogs({
            address: contracts.atpFactory.address as `0x${string}`,
            event: atpCreatedEvent,
            args: {
              beneficiary: beneficiaryAddress,
            },
            fromBlock,
            toBlock,
          });

          userLogs = userLogs.concat(chunkUserLogs);
        } catch (chunkError) {
          console.error(
            `Error fetching chunk ${fromBlock}-${toBlock}:`,
            chunkError,
          );
        }
      }

      return userLogs;
    } catch (error) {
      console.error("Error fetching ATPCreated events:", error);
      return [];
    }
  }, [beneficiaryAddress, publicClient]);

  return {
    getATPCreatedLogs,
  };
}
