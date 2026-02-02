import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";
import { ProposalState } from "./governanceTypes";

export function useProposalState(proposalId: bigint | undefined) {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "getProposalState",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: proposalId !== undefined,
    },
  });

  return {
    state: query.data !== undefined ? (query.data as ProposalState) : undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
