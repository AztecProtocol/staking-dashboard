import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { AtpRegistryAbi } from "../../contracts/abis/ATPRegistry";

/**
 * Milestone status enum matching Registry.sol
 * CRITICAL: Use "Succeeded" (value 2), NOT "Reached"
 */
export enum MilestoneStatus {
  Pending = 0,    // Milestone not yet reached
  Failed = 1,     // Milestone failed
  Succeeded = 2,  // Milestone achieved - only this allows claiming tokens out of the MATP
}

interface UseMilestoneStatusParams {
  registryAddress: Address | undefined;
  milestoneId?: bigint;
  enabled?: boolean;
}

/**
 * Hook to fetch milestone status from ATP Registry
 */
export function useMilestoneStatus({
  registryAddress,
  milestoneId,
  enabled = true,
}: UseMilestoneStatusParams) {
  const milestoneStatusQuery = useReadContract({
    abi: AtpRegistryAbi,
    address: registryAddress,
    functionName: "getMilestoneStatus",
    args: milestoneId !== undefined ? [milestoneId] : undefined,
    query: {
      enabled: enabled && registryAddress !== undefined && milestoneId !== undefined,
      refetchInterval: 5 * 60 * 1000,  // Refresh every 5 minutes
      staleTime: 5 * 60 * 1000,        // Cache for 5 minutes
    },
  });

  return {
    status: milestoneStatusQuery.data as MilestoneStatus | undefined,
    isLoading: milestoneStatusQuery.isLoading,
    error: milestoneStatusQuery.error,
    refetch: milestoneStatusQuery.refetch,
  };
}

/**
 * Whether the beneficiary can unstake (initiate/finalize a rollup withdrawal) from an MATP.
 *
 * The milestone gates CLAIMING (MATPCore.getClaimable returns 0 unless Succeeded), not unstaking: the
 * staker's initiateWithdraw only requires the ATP operator, and the tokens return to the MATP, not the
 * beneficiary. What a Failed milestone does change is who the operator is: control passes to the revoker,
 * so the beneficiary can no longer unstake. Pending and Succeeded both allow it.
 */
export function canUnstakeWithMilestone(status?: MilestoneStatus): boolean {
  return status !== MilestoneStatus.Failed;
}

/**
 * Helper to get human-readable status text
 */
export function getMilestoneStatusText(status?: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.Pending:
      return "Pending";
    case MilestoneStatus.Failed:
      return "Failed";
    case MilestoneStatus.Succeeded:
      return "Achieved";  // User-friendly text
    default:
      return "Unknown";
  }
}

/**
 * Helper to get status colors (using actual theme colors)
 */
export function getMilestoneStatusColors(status?: MilestoneStatus): {
  text: string;
  bg: string;
  border: string;
  indicator: string;
} {
  switch (status) {
    case MilestoneStatus.Pending:
      return {
        text: "text-aqua",
        bg: "bg-aqua/10",
        border: "border-aqua/40",
        indicator: "bg-aqua",
      };
    case MilestoneStatus.Failed:
      return {
        text: "text-vermillion",
        bg: "bg-vermillion/10",
        border: "border-vermillion/40",
        indicator: "bg-vermillion",
      };
    case MilestoneStatus.Succeeded:
      return {
        text: "text-chartreuse",
        bg: "bg-chartreuse/10",
        border: "border-chartreuse/40",
        indicator: "bg-chartreuse",
      };
    default:
      return {
        text: "text-parchment/60",
        bg: "bg-parchment/5",
        border: "border-parchment/20",
        indicator: "bg-parchment/40",
      };
  }
}
