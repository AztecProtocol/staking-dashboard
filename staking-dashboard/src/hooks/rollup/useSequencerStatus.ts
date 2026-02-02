import type { Address } from "viem";
import { useBlock } from "wagmi";
import { useAttesterView } from "./useAttesterView";

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

  // Check if withdrawal can be finalized (status is EXITING and current time >= exitable time)
  const canFinalize = !!(isExiting && exit && blockTimestamp >= exit.exitableAt);

  return {
    status,
    statusLabel,
    effectiveBalance,
    exit,
    isActive,
    isZombie,
    isExiting,
    canFinalize,
    isLoading,
    error,
    refetch,
  };
}
