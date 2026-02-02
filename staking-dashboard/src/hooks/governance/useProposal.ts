import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";
import type { Proposal, ProposalRaw } from "./governanceTypes";
import { ProposalState } from "./governanceTypes";

export function useProposal(proposalId: bigint | undefined) {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: proposalId !== undefined,
    },
  });

  const rawData = query.data as ProposalRaw | undefined;

  const proposal: Proposal | undefined = rawData
    ? {
        id: proposalId!,
        state: rawData.state as ProposalState,
        config: rawData.configuration,
        payloadAddress: rawData.payload,
        proposerAddress: rawData.creator,
        creationTimestamp: rawData.creation,
        ballot: rawData.summedBallot,
      }
    : undefined;

  return {
    proposal,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
