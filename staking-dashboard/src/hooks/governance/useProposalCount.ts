import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";

export function useProposalCount() {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "proposalCount",
  });

  return {
    proposalCount: query.data as bigint | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
