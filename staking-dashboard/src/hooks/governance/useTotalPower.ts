import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";

export function useTotalPower() {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "totalPowerNow",
  });

  return {
    totalPower: query.data as bigint | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTotalPowerAt(timestamp: bigint | undefined) {
  const query = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "totalPowerAt",
    args: timestamp !== undefined ? [timestamp] : undefined,
    query: {
      enabled: timestamp !== undefined,
    },
  });

  return {
    totalPower: query.data as bigint | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
