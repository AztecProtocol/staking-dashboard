import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";
import type { Address } from "viem";
import type { Ballot } from "./governanceTypes";

interface UseUserBallotParams {
  proposalId: bigint | undefined;
  voterAddress?: Address;
}

export function useUserBallot({ proposalId, voterAddress }: UseUserBallotParams) {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "getBallot",
    args: proposalId !== undefined && voterAddress ? [proposalId, voterAddress] : undefined,
    query: {
      enabled: proposalId !== undefined && !!voterAddress,
    },
  });

  const ballot = query.data as Ballot | undefined;

  const hasVoted = ballot ? ballot.yea > 0n || ballot.nay > 0n : false;

  return {
    ballot,
    hasVoted,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
