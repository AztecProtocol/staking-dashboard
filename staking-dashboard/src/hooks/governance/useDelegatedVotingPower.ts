import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { contracts } from "@/contracts";

interface DelegatedPowerResult {
  /** Total delegated voting power at snapshot time (usable for voting) */
  totalPower: bigint;
  /** Current delegated voting power (may differ from snapshot) */
  currentPower: bigint;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get the user's delegated voting power from staked positions.
 * This queries the GSE contract for the total voting power delegated to the user.
 * Returns both snapshot power (usable for voting on a specific proposal) and
 * current power (to show the user what they have now).
 */
export function useDelegatedVotingPower({
  userAddress,
  timestamp,
  enabled = true,
}: {
  userAddress?: Address;
  timestamp?: bigint;
  atpHoldings?: unknown; // Kept for backwards compatibility, no longer used
  enabled?: boolean;
}): DelegatedPowerResult {
  // Query voting power at specific timestamp (for voting on proposals)
  const { data: snapshotPower, isLoading: isLoadingSnapshot, error: snapshotError } = useReadContract({
    abi: contracts.gse.abi,
    address: contracts.gse.address,
    functionName: "getVotingPowerAt",
    args: [userAddress as Address, timestamp as bigint],
    query: {
      enabled: enabled && !!userAddress && timestamp !== undefined,
    },
  });

  // Query current voting power (to show user what they have now)
  const { data: currentPower, isLoading: isLoadingCurrent, error: currentError } = useReadContract({
    abi: contracts.gse.abi,
    address: contracts.gse.address,
    functionName: "getVotingPower",
    args: [userAddress as Address],
    query: {
      enabled: enabled && !!userAddress,
    },
  });

  // Use snapshot power if timestamp provided, otherwise use current power
  const totalPower = timestamp !== undefined
    ? (typeof snapshotPower === "bigint" ? snapshotPower : 0n)
    : (typeof currentPower === "bigint" ? currentPower : 0n);

  return {
    totalPower,
    currentPower: typeof currentPower === "bigint" ? currentPower : 0n,
    isLoading: isLoadingSnapshot || isLoadingCurrent,
    error: snapshotError ?? currentError ?? null,
  };
}
