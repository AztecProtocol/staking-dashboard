import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";
import type { Address } from "viem";
import type { UserVotingPower } from "./governanceTypes";

interface UseUserGovernancePowerParams {
  userAddress?: Address;
  stakerAddress?: Address;
}

export function useUserGovernancePower({
  userAddress,
  stakerAddress,
}: UseUserGovernancePowerParams) {
  // Get direct deposit power (user deposited directly to governance)
  const directPowerQuery = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "powerNow",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get staker power (ATP holder deposited through staker)
  const stakerPowerQuery = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "powerNow",
    args: stakerAddress ? [stakerAddress] : undefined,
    query: {
      enabled: !!stakerAddress,
    },
  });

  const directPower = (directPowerQuery.data as bigint) ?? 0n;
  const stakerPower = (stakerPowerQuery.data as bigint) ?? 0n;

  // Build stakerPowers array for compatibility with new UserVotingPower type
  const stakerPowers = stakerAddress && stakerPower > 0n
    ? [{
        stakerAddress,
        atpAddress: stakerAddress, // Not available in this hook
        atpType: "Unknown",
        sequentialNumber: 0,
        power: stakerPower,
      }]
    : [];

  const votingPower: UserVotingPower = {
    directPower,
    stakerPowers,
    totalPower: directPower + stakerPower,
  };

  return {
    votingPower,
    isLoading: directPowerQuery.isLoading || stakerPowerQuery.isLoading,
    error: directPowerQuery.error || stakerPowerQuery.error,
    refetch: () => {
      directPowerQuery.refetch();
      stakerPowerQuery.refetch();
    },
  };
}
