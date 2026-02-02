import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import type { ATPHolding } from "@/hooks/atp";
import { CommonATPAbi } from "@/contracts/abis/ATP";
import { isAuctionRegistry } from "@/hooks/atpRegistry";

export interface DelegationEligibleATP {
  holding: ATPHolding;
  registryAddress: Address;
}

interface UseDelegationEligibleATPsParams {
  atpHoldings: ATPHolding[];
  enabled?: boolean;
}

/**
 * Hook to filter ATPs that are eligible for delegation.
 *
 * Eligibility criteria:
 * 1. Has a staker address (required for delegation)
 * 2. Registry is atpRegistryAuction (only auction ATPs can delegate)
 *
 * Note: Version >= 2 check is done separately in the modal using useStakerGovernanceSupport
 * when an ATP is selected (following the same pattern as DepositToGovernanceModal).
 */
export function useDelegationEligibleATPs({
  atpHoldings,
  enabled = true,
}: UseDelegationEligibleATPsParams) {
  // Filter to only ATPs with staker addresses
  const atpsWithStaker = useMemo(() => {
    return atpHoldings.filter((h) => h.stakerAddress);
  }, [atpHoldings]);

  // Batch-fetch registry addresses for all ATPs
  const registryContracts = useMemo(() => {
    return atpsWithStaker.map((holding) => ({
      abi: CommonATPAbi,
      address: holding.address as Address,
      functionName: "getRegistry" as const,
    }));
  }, [atpsWithStaker]);

  const { data: registryResults, isLoading } = useReadContracts({
    contracts: registryContracts,
    query: {
      enabled: enabled && atpsWithStaker.length > 0,
    },
  });

  // Filter to only auction ATPs
  const eligibleATPs = useMemo((): DelegationEligibleATP[] => {
    if (!registryResults) return [];

    return atpsWithStaker
      .map((holding, idx) => {
        const registryAddress = registryResults[idx]?.result as Address | undefined;
        return { holding, registryAddress };
      })
      .filter(
        (item): item is DelegationEligibleATP =>
          !!item.registryAddress && isAuctionRegistry(item.registryAddress)
      );
  }, [atpsWithStaker, registryResults]);

  return {
    eligibleATPs,
    isLoading,
    hasEligibleATPs: eligibleATPs.length > 0,
  };
}
