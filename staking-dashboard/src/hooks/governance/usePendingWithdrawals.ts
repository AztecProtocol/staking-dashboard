import { useEffect, useState, useCallback } from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem, type Address } from "viem";
import { contracts } from "@/contracts";
import { useBlockTimestamp } from "../useBlockTimestamp";

export interface PendingWithdrawal {
  withdrawalId: bigint;
  amount: bigint;
  unlocksAt: bigint;
  recipient: Address;
  claimed: boolean;
  canFinalize: boolean;
}

interface UsePendingWithdrawalsParams {
  userAddress?: Address;
  atpAddresses?: Address[];
}

/**
 * Hook to query all pending withdrawals for a user from the Governance contract.
 * Fetches WithdrawInitiated events for both:
 * - Direct withdrawals (recipient = userAddress)
 * - ATP withdrawals (recipient = atpAddress, since Staker sends tokens to the ATP)
 * Then queries each withdrawal's current status.
 */
export function usePendingWithdrawals({ userAddress, atpAddresses = [] }: UsePendingWithdrawalsParams) {
  const publicClient = usePublicClient();
  const { blockTimestamp } = useBlockTimestamp();
  // Stringify for stable comparison - prevents re-renders when array reference changes
  const atpAddressesKey = JSON.stringify(atpAddresses);
  const [withdrawalIds, setWithdrawalIds] = useState<bigint[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<Error | null>(null);
  const [mayHaveOlderWithdrawals, setMayHaveOlderWithdrawals] = useState(false);

  // Fetch WithdrawInitiated events for all relevant recipients (user + stakers)
  const fetchWithdrawalEvents = useCallback(async () => {
    // Parse stringified addresses for stable reference
    const addresses = JSON.parse(atpAddressesKey) as Address[];

    if (!publicClient || !userAddress) {
      setWithdrawalIds([]);
      setMayHaveOlderWithdrawals(false);
      return;
    }

    setIsLoadingEvents(true);
    setEventsError(null);

    try {
      // Build list of all recipients to query (user address + staker addresses)
      const recipients = [userAddress, ...addresses];

      // Chunked block scanning to avoid RPC limits (~28 days on mainnet)
      const CHUNK_SIZE = 50000n;
      const MAX_BLOCKS_BACK = 200000n;
      const blockNumber = await publicClient.getBlockNumber();
      const startBlock = blockNumber;
      const endBlock = blockNumber > MAX_BLOCKS_BACK ? blockNumber - MAX_BLOCKS_BACK : 0n;

      // Track if we didn't scan from genesis (older withdrawals may exist)
      setMayHaveOlderWithdrawals(endBlock > 0n);

      const withdrawInitiatedEvent = parseAbiItem(
        "event WithdrawInitiated(uint256 indexed withdrawalId, address indexed recipient, uint256 amount)"
      );

      let allIds: bigint[] = [];

      // Fetch events in chunks going backwards in history to avoid RPC limits
      for (let toBlock = startBlock; toBlock >= endBlock; toBlock -= CHUNK_SIZE) {
        const fromBlock = toBlock - CHUNK_SIZE + 1n < endBlock ? endBlock : toBlock - CHUNK_SIZE + 1n;

        try {
          // Fetch logs for all recipients in parallel within each chunk
          const logsPromises = recipients.map((recipient) =>
            publicClient.getLogs({
              address: contracts.governance.address,
              event: withdrawInitiatedEvent,
              args: {
                recipient,
              },
              fromBlock,
              toBlock,
            })
          );

          const chunkLogs = await Promise.all(logsPromises);
          const chunkIds = chunkLogs.flatMap((logs) => logs.map((log) => log.args.withdrawalId as bigint));
          allIds = allIds.concat(chunkIds);
        } catch (chunkError) {
          console.error(`Error fetching withdrawal events chunk ${fromBlock}-${toBlock}:`, chunkError);
        }
      }

      // Deduplicate withdrawal IDs (in case of any overlap)
      const uniqueIds = [...new Set(allIds.map((id) => id.toString()))].map((id) => BigInt(id));
      setWithdrawalIds(uniqueIds);
    } catch (error) {
      console.error("Failed to fetch withdrawal events:", error);
      setEventsError(error instanceof Error ? error : new Error("Failed to fetch events"));
    } finally {
      setIsLoadingEvents(false);
    }
  }, [publicClient, userAddress, atpAddressesKey]);

  useEffect(() => {
    fetchWithdrawalEvents();
  }, [fetchWithdrawalEvents]);

  // Query status of each withdrawal
  const withdrawalQueries = useReadContracts({
    contracts: withdrawalIds.map((id) => ({
      abi: contracts.governance.abi,
      address: contracts.governance.address,
      functionName: "getWithdrawal" as const,
      args: [id],
    })),
    query: {
      enabled: withdrawalIds.length > 0,
    },
  });

  // Combine event data with on-chain status
  // Use blockchain time for consistency with on-chain validation (with browser fallback)
  const now = blockTimestamp ?? BigInt(Math.floor(Date.now() / 1000));
  const pendingWithdrawals: PendingWithdrawal[] = [];

  for (let i = 0; i < withdrawalIds.length; i++) {
    const withdrawalId = withdrawalIds[i];
    const result = withdrawalQueries.data?.[i];

    if (!result || result.status !== "success" || !result.result) {
      continue;
    }

    const withdrawal = result.result as {
      amount: bigint;
      unlocksAt: bigint;
      recipient: Address;
      claimed: boolean;
    };

    // Only include unclaimed withdrawals
    if (withdrawal.claimed) {
      continue;
    }

    pendingWithdrawals.push({
      withdrawalId,
      amount: withdrawal.amount,
      unlocksAt: withdrawal.unlocksAt,
      recipient: withdrawal.recipient,
      claimed: withdrawal.claimed,
      canFinalize: now >= withdrawal.unlocksAt,
    });
  }

  return {
    pendingWithdrawals,
    isLoading: isLoadingEvents || withdrawalQueries.isLoading,
    error: eventsError || withdrawalQueries.error,
    mayHaveOlderWithdrawals,
    refetch: () => {
      fetchWithdrawalEvents();
      withdrawalQueries.refetch();
    },
  };
}
