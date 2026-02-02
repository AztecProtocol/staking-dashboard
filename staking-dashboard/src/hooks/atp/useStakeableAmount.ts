import { useReadContract } from "wagmi";
import type { ATPData } from "./atpTypes";
import { ERC20Abi } from "../../contracts/abis/ERC20";
import { LATPAbi } from "../../contracts/abis/LATP";
import { useRollupData } from "../rollup/useRollupData";

/**
 * Calculate stakeable amount (largest multiple of threshold)
 */
export function calculateStakeableAmount(
  rawAmount: bigint,
  activationThreshold: bigint
): bigint {
  if (rawAmount === 0n) {
    return 0n;
  }
  if (activationThreshold === 0n) {
    return rawAmount;
  }
  const multiplier = rawAmount / activationThreshold;
  return multiplier * activationThreshold;
}

/**
 * Check if ATP should use getStakeableAmount() contract call.
 * Only revokable LATPs have this function - it calculates vested amount available for staking.
 * All other ATP types (MATP, NCATP, non-revokable LATP) use token balance directly.
 */
export function usesGetStakeableAmount(atpData: ATPData | null | undefined): boolean {
  return atpData?.typeString === "LATP" && atpData?.isRevokable === true;
}

/**
 * Check if ATP uses token balance (MATP, NCATP, or non-revokable LATP)
 */
export function usesTokenBalance(atpData: ATPData | null | undefined): boolean {
  return !usesGetStakeableAmount(atpData);
}

/**
 * Hook to get stakeable amount for an ATP position
 *
 * - LATP revokable: getStakeableAmount() from contract
 * - LATP non-revokable: stakingToken.balanceOf(atpAddress)
 *
 * - NCATP revokable: getStakeableAmount() from contract
 * - NCATP non-revokable: stakingToken.balanceOf(atpAddress)
 *
 * - MATP non-revokable: stakingToken.balanceOf(atpAddress)
 */
export function useStakeableAmount(atpData: ATPData | null | undefined) {
  const { activationThreshold, isLoading: isLoadingThreshold } =
    useRollupData();

  const {
    data: stakeableAmount,
    isLoading: isLoadingStakeableAmount,
    refetch: refetchStakeableAmount,
  } = useReadContract({
    address: atpData?.atpAddress,
    abi: LATPAbi,
    functionName: "getStakeableAmount",
    query: {
      enabled: !!atpData && usesGetStakeableAmount(atpData),
    },
  });

  const {
    data: tokenBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: atpData?.token,
    abi: ERC20Abi,
    functionName: "balanceOf",
    args: atpData?.atpAddress ? [atpData.atpAddress] : undefined,
    query: {
      enabled: !!atpData && usesTokenBalance(atpData),
    },
  });

  const rawAmount = usesGetStakeableAmount(atpData)
    ? (stakeableAmount ?? 0n)
    : (tokenBalance ?? 0n);

  const calculatedStakeableAmount = calculateStakeableAmount(
    rawAmount,
    activationThreshold ?? 0n
  );
  const isStakeable = calculatedStakeableAmount >= (activationThreshold ?? 0n);

  const refetch = async () => {
    if (usesGetStakeableAmount(atpData)) {
      await refetchStakeableAmount();
    } else {
      await refetchBalance();
    }
  };

  return {
    stakeableAmount: calculatedStakeableAmount,
    hasStakeableAmount: calculatedStakeableAmount > 0n,
    isStakeable,
    activationThreshold,
    isLoading:
      isLoadingStakeableAmount || isLoadingBalance || isLoadingThreshold,
    refetch,
  };
}
