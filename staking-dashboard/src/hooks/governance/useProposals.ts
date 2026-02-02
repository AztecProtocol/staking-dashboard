import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReadContract, usePublicClient } from "wagmi";
import { contracts } from "@/contracts";
import { PayloadAbi } from "@/contracts/abis/Payload";
import type { Proposal, ProposalRaw } from "./governanceTypes";
import { ProposalState } from "./governanceTypes";

const DEFAULT_PROPOSALS_LIMIT = 10;
const LOAD_MORE_INCREMENT = 10;

export function useProposals() {
  const publicClient = usePublicClient();
  const [limit, setLimit] = useState(DEFAULT_PROPOSALS_LIMIT);

  // First get the proposal count
  const countQuery = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "proposalCount",
  });

  const proposalCount = countQuery.data as bigint | undefined;

  // Calculate which proposal IDs to fetch (most recent first)
  const proposalIds = useMemo(() => {
    const ids: bigint[] = [];
    if (proposalCount && proposalCount > 0n) {
      const numToFetch = proposalCount < BigInt(limit)
        ? Number(proposalCount)
        : limit;

      for (let i = 0; i < numToFetch; i++) {
        ids.push(proposalCount - 1n - BigInt(i));
      }
    }
    return ids;
  }, [proposalCount, limit]);

  // Fetch all proposals in parallel
  const proposalsQuery = useQuery({
    queryKey: ["proposals", proposalIds.map(String)],
    queryFn: async () => {
      if (!publicClient || proposalIds.length === 0) return [];

      const proposals: Proposal[] = [];

      for (const id of proposalIds) {
        try {
          // Fetch proposal data
          const rawData = await publicClient.readContract({
            abi: contracts.governance.abi,
            address: contracts.governance.address,
            functionName: "getProposal",
            args: [id],
          }) as ProposalRaw;

          // Fetch current state (may differ from stored state)
          const currentState = await publicClient.readContract({
            abi: contracts.governance.abi,
            address: contracts.governance.address,
            functionName: "getProposalState",
            args: [id],
          }) as number;

          // Fetch URI from payload contract (optional - some payloads may not have it)
          let uri: string | undefined;
          try {
            uri = await publicClient.readContract({
              abi: PayloadAbi,
              address: rawData.payload,
              functionName: "getURI",
            }) as string;
            // Treat empty string as undefined
            if (!uri || uri.trim() === "") {
              uri = undefined;
            }
          } catch {
            // Payload may not implement getURI or it may revert
            uri = undefined;
          }

          proposals.push({
            id,
            state: currentState as ProposalState,
            config: rawData.configuration,
            payloadAddress: rawData.payload,
            proposerAddress: rawData.creator,
            creationTimestamp: rawData.creation,
            ballot: rawData.summedBallot,
            uri,
          });
        } catch (error) {
          console.error(`Failed to fetch proposal ${id}:`, error);
        }
      }

      return proposals;
    },
    enabled: !!publicClient && proposalIds.length > 0,
    staleTime: 30_000, // 30 seconds
  });

  // Check if there are more proposals to load
  const hasMore = proposalCount ? limit < Number(proposalCount) : false;

  // Load more proposals
  const loadMore = useCallback(() => {
    setLimit((prev) => prev + LOAD_MORE_INCREMENT);
  }, []);

  return {
    proposals: proposalsQuery.data ?? [],
    proposalCount,
    isLoading: countQuery.isLoading || proposalsQuery.isLoading,
    isLoadingMore: proposalsQuery.isFetching && !proposalsQuery.isLoading,
    error: countQuery.error || proposalsQuery.error,
    hasMore,
    loadMore,
    refetch: () => {
      countQuery.refetch();
      proposalsQuery.refetch();
    },
  };
}
