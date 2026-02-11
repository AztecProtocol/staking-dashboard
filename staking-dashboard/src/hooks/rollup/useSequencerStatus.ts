import type { Address } from "viem";
import { useBlock } from "wagmi";
import { useAttesterView } from "./useAttesterView";
import { useGovernanceWithdrawal } from "../governance/useGovernanceWithdrawal";

/**
 * Enum for sequencer status values
 * 0 = NONE - Does not exist in the setup
 * 1 = VALIDATING - Participating as validator
 * 2 = ZOMBIE - Not participating as validator, but have funds in setup (hit if slashed and going below the minimum)
 * 3 = EXITING - In the process of exiting the system
 */
export enum SequencerStatus {
  NONE = 0,
  VALIDATING = 1,
  ZOMBIE = 2,
  EXITING = 3,
}

/**
 * Helper to get human-readable status label
 */
export function getStatusLabel(status: number | undefined): string {
  if (status === undefined) return "Unknown";

  switch (status) {
    case SequencerStatus.NONE:
      return "None";
    case SequencerStatus.VALIDATING:
      return "Validating";
    case SequencerStatus.ZOMBIE:
      return "Inactive";
    case SequencerStatus.EXITING:
      return "Exiting/Unstaking";
    default:
      return "Unknown";
  }
}

/**
 * Hook to get sequencer status information
 * @param sequencerAddress - The address of the sequencer
 * @returns Sequencer status, label, and related information
 */
export function useSequencerStatus(sequencerAddress: Address | undefined) {
  const { status, effectiveBalance, exit, isLoading, error, refetch } =
    useAttesterView(sequencerAddress);

  // Query the governance withdrawal to get the REAL unlock time
  const { withdrawal, isLoading: isLoadingWithdrawal } = useGovernanceWithdrawal(exit?.withdrawalId);

  // ANVIL FIX: Use blockchain timestamp instead of Date.now() for local testing
  // When using anvil with time manipulation (anvil_increaseTime), Date.now() returns
  // real system time while the blockchain has a different timestamp. This causes
  // canFinalize to be false even when the exit delay has passed on-chain.
  // In production, blockchain time ~= real time so this doesn't matter.
  const { data: block } = useBlock({ watch: true });
  const blockTimestamp = block?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));
  // const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));

  const statusLabel = getStatusLabel(status);
  const isActive = status === SequencerStatus.VALIDATING;
  const isZombie = status === SequencerStatus.ZOMBIE;
  const isExiting = status === SequencerStatus.EXITING;

  // The REAL unlock time is the MAX of:
  // 1. Rollup's exitableAt (currently 4 days, but could be higher in future)
  // 2. Governance's withdrawal.unlocksAt (14.6 days)
  // Both must be available to calculate the actual unlock time
  const actualUnlockTime =
    exit && withdrawal
      ? (exit.exitableAt > withdrawal.unlocksAt ? exit.exitableAt : withdrawal.unlocksAt)
      : undefined;

  // Check if withdrawal can be finalized using the REAL unlock time
  const canFinalize = !!(
    isExiting &&
    actualUnlockTime &&
    blockTimestamp >= actualUnlockTime
  );

  return {
    status,
    statusLabel,
    effectiveBalance,
    exit,
    withdrawal,
    actualUnlockTime,
    isActive,
    isZombie,
    isExiting,
    canFinalize,
    isLoading: isLoading || isLoadingWithdrawal,
    error,
    refetch,
  };
}
