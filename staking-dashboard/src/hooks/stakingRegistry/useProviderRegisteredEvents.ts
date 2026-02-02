import { usePublicClient } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { parseAbiItem, type GetLogsReturnType } from "viem";
import { contracts } from "../../contracts";

const providerRegisteredEvent = parseAbiItem(
  "event ProviderRegistered(uint256 indexed providerIdentifier, address indexed providerAdmin, uint16 indexed providerTakeRate)",
);

type ProviderRegisteredEvent = GetLogsReturnType<
  typeof providerRegisteredEvent
>[0];

/**
 * Hook to fetch ProviderRegistered events from the StakingRegistry contract
 */
export function useProviderRegisteredEvents() {
  const [events, setEvents] = useState<ProviderRegisteredEvent[]>([]);

  const client = usePublicClient();

  // Use actual events as source of truth for registered providers
  const actualProviderCount = events.length;
  const hasRegisteredProviders = actualProviderCount > 0;

  // Fetch ProviderRegistered events using chunked approach
  const fetchProviderRegisteredEvents = useCallback(async () => {
    if (!client) return [];

    try {
      const blockNumber = await client.getBlockNumber();

      const CHUNK_SIZE = 50000n;
      const MAX_BLOCKS_BACK = 200000n;
      const startBlock = blockNumber;
      const endBlock =
        blockNumber > MAX_BLOCKS_BACK ? blockNumber - MAX_BLOCKS_BACK : 0n;

      let allLogs: ProviderRegisteredEvent[] = [];

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
          const chunkLogs = await client.getLogs({
            address: contracts.stakingRegistry.address,
            event: providerRegisteredEvent,
            fromBlock,
            toBlock,
          });

          allLogs = allLogs.concat(chunkLogs);
        } catch (chunkError) {
          console.error(
            `Error fetching chunk ${fromBlock}-${toBlock}:`,
            chunkError,
          );
        }
      }

      return allLogs;
    } catch (error) {
      console.error("Error fetching ProviderRegistered events:", error);
      return [];
    }
  }, [client]);

  useEffect(() => {
    const fetchEvents = async () => {
      const events = await fetchProviderRegisteredEvents();
      setEvents(events);
    };

    if (contracts.stakingRegistry.address && client) {
      fetchEvents();
    }
  }, [client, fetchProviderRegisteredEvents]);

  // Manual refetch function for events
  const refetchEvents = async () => {
    if (contracts.stakingRegistry.address && client) {
      const events = await fetchProviderRegisteredEvents();
      setEvents(events);
    }
  };

  return {
    hasRegisteredProviders,
    providerCount: actualProviderCount,
    events,
    refetchEvents,
  };
}
