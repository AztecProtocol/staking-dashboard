import { useReadContracts } from "wagmi";
import { contracts } from "@/contracts";
import type { Address } from "viem";
import type { Ballot, BallotsBySource } from "./governanceTypes";

interface UseMultipleUserBallotsParams {
  proposalId: bigint | undefined;
  userAddress?: Address;
  stakerAddresses: Address[];
}

/**
 * Hook to fetch ballots for all voting sources (direct + all stakers)
 * for a given proposal.
 */
export function useMultipleUserBallots({
  proposalId,
  userAddress,
  stakerAddresses,
}: UseMultipleUserBallotsParams) {
  // Build contract calls for getBallot queries
  const contractCalls = [];
  const addressOrder: string[] = []; // Track order for result mapping

  // Query ballot for direct voter (user address)
  if (proposalId !== undefined && userAddress) {
    contractCalls.push({
      abi: contracts.governance.abi,
      address: contracts.governance.address,
      functionName: "getBallot" as const,
      args: [proposalId, userAddress],
    });
    addressOrder.push("direct");
  }

  // Query ballot for each staker address
  if (proposalId !== undefined) {
    for (const stakerAddress of stakerAddresses) {
      contractCalls.push({
        abi: contracts.governance.abi,
        address: contracts.governance.address,
        functionName: "getBallot" as const,
        args: [proposalId, stakerAddress],
      });
      addressOrder.push(stakerAddress);
    }
  }

  const { data: results, isLoading, error, refetch } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: proposalId !== undefined && (!!userAddress || stakerAddresses.length > 0),
    },
  });

  // Build ballots map
  const ballots: BallotsBySource = new Map();

  if (results) {
    results.forEach((result, index) => {
      const key = addressOrder[index];
      const ballot = result?.result as Ballot | undefined;
      if (ballot) {
        ballots.set(key, ballot);
      }
    });
  }

  // Check if any ballot has votes
  const hasAnyVotes = Array.from(ballots.values()).some(
    (ballot) => ballot.yea > 0n || ballot.nay > 0n
  );

  return {
    ballots,
    hasAnyVotes,
    isLoading,
    error,
    refetch,
  };
}
