import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";
import type { Address } from "viem";

interface UseUserPowerAtParams {
  userAddress?: Address;
  timestamp?: bigint;
}

/**
 * Get a user's direct governance power at a specific timestamp.
 * Used to display the correct available voting power for a proposal,
 * since voting uses snapshot power (power at proposal's pendingThrough time).
 */
export function useUserPowerAt({ userAddress, timestamp }: UseUserPowerAtParams) {
  const { data, isLoading, error, refetch } = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "powerAt",
    args: userAddress && timestamp ? [userAddress, timestamp] : undefined,
    query: {
      enabled: !!userAddress && !!timestamp,
    },
  });

  return {
    power: (data as bigint) ?? 0n,
    isLoading,
    error,
    refetch,
  };
}
