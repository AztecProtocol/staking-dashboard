import { useReadContracts } from "wagmi";
import { contracts } from "@/contracts";
import type { Address } from "viem";
import type { UserVotingPower, StakerVotingPower } from "./governanceTypes";
import type { ATPHolding } from "../atp/useAtpHoldings";

interface UseMultipleStakerGovernancePowerParams {
  userAddress?: Address;
  atpHoldings: ATPHolding[];
  /** Optional timestamp to query historical power at (e.g., proposal snapshot time) */
  timestamp?: bigint;
}

/**
 * Hook to fetch governance voting power for a user across all their ATPs
 * and their direct deposit (if any).
 */
export function useMultipleStakerGovernancePower({
  userAddress,
  atpHoldings,
  timestamp,
}: UseMultipleStakerGovernancePowerParams) {
  // Build contract calls for power queries
  // Use powerAt(address, timestamp) when timestamp is provided, otherwise powerNow(address)
  // First call is for direct power (userAddress), rest are for each staker
  const contractCalls = [];

  // Query direct power for user address
  if (userAddress) {
    contractCalls.push({
      abi: contracts.governance.abi,
      address: contracts.governance.address,
      functionName: timestamp ? ("powerAt" as const) : ("powerNow" as const),
      args: timestamp ? [userAddress, timestamp] : [userAddress],
    });
  }

  // Query power for each staker address (deduplicated)
  const uniqueStakers = new Map<string, ATPHolding>();
  for (const holding of atpHoldings) {
    if (holding.stakerAddress && !uniqueStakers.has(holding.stakerAddress)) {
      uniqueStakers.set(holding.stakerAddress, holding);
    }
  }

  const stakerEntries = Array.from(uniqueStakers.entries());
  for (const [stakerAddress] of stakerEntries) {
    contractCalls.push({
      abi: contracts.governance.abi,
      address: contracts.governance.address,
      functionName: timestamp ? ("powerAt" as const) : ("powerNow" as const),
      args: timestamp ? [stakerAddress as Address, timestamp] : [stakerAddress as Address],
    });
  }

  const { data: results, isLoading, error, refetch } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: !!userAddress || atpHoldings.length > 0,
    },
  });

  // Parse results
  let directPower = 0n;
  const stakerPowers: StakerVotingPower[] = [];

  if (results) {
    // First result is direct power (if userAddress was provided)
    let resultIndex = 0;
    if (userAddress) {
      const result = results[resultIndex]?.result;
      directPower = typeof result === "bigint" ? result : 0n;
      resultIndex++;
    }

    // Rest are staker powers
    for (const [stakerAddress, holding] of stakerEntries) {
      const result = results[resultIndex]?.result;
      const power = typeof result === "bigint" ? result : 0n;
      stakerPowers.push({
        stakerAddress: stakerAddress as Address,
        atpAddress: holding.address as Address,
        atpType: holding.type,
        sequentialNumber: holding.sequentialNumber,
        power,
      });
      resultIndex++;
    }
  }

  // Calculate total power
  const totalStakerPower = stakerPowers.reduce((sum, s) => sum + s.power, 0n);
  const totalPower = directPower + totalStakerPower;

  const votingPower: UserVotingPower = {
    directPower,
    stakerPowers,
    totalPower,
  };

  return {
    votingPower,
    isLoading,
    error,
    refetch,
  };
}
