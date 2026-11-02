import { useWriteContract, useWaitForTransactionReceipt } from "@/hooks/useWagmiStrategy"
import type { Address } from "viem"
import { ATPWithdrawableStakerAbi } from "@/contracts/abis/ATPWithdrawableStaker"
import {
  useMilestoneStatus,
  canUnstakeWithMilestone,
} from "@/hooks/atpRegistry/useMilestoneStatus"

interface UseInitiateWithdrawOptions {
  registryAddress?: Address;
  milestoneId?: bigint;
  atpType?: string;
}

/**
 * Hook to initiate withdrawal from the rollup for a delegation
 * @param stakerAddress - Address of the withdrawable staker contract
 * @param options - Optional milestone validation parameters
 * @returns Hook with initiateWithdraw function and transaction status
 */
export function useInitiateWithdraw(
  stakerAddress: Address,
  options?: UseInitiateWithdrawOptions
) {
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Check milestone status for MATPs
  const {
    status: milestoneStatus,
    isLoading: isMilestoneLoading,
    error: milestoneError,
  } = useMilestoneStatus({
    registryAddress: options?.registryAddress,
    milestoneId: options?.milestoneId,
    enabled: options?.atpType === 'MATP' && !!options?.registryAddress,
  });

  const isMATP = options?.atpType === 'MATP';
  // A pending milestone does NOT block unstaking: it only blocks claiming tokens out of the MATP.
  // Only a failed milestone does, because the revoker then becomes the operator.
  const canWithdraw = !isMATP || canUnstakeWithMilestone(milestoneStatus);

  const milestoneBlockError = isMATP && !canWithdraw
    ? "Cannot unstake: this Token Vault's milestone failed, so control has passed to the revoker."
    : null;

  const initiateWithdraw = (version: bigint, attesterAddress: Address) => {
    // Don't throw - let UI handle via disabled state
    return writeContract({
      abi: ATPWithdrawableStakerAbi,
      address: stakerAddress,
      functionName: "initiateWithdraw",
      args: [version, attesterAddress],
    })
  }

  return {
    initiateWithdraw,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || milestoneError,
    hash,
    // Milestone-specific state for UI
    milestoneStatus,
    isMilestoneLoading,
    canWithdraw,
    milestoneBlockError,  // Explicit error message for UI
  }
}
