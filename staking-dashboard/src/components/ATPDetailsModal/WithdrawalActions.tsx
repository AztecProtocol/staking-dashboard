import { useEffect } from "react";
import type { Address } from "viem";
import { useInitiateWithdraw } from "@/hooks/staker/useInitiateWithdraw";
import { useFinalizeWithdraw } from "@/hooks/rollup/useFinalizeWithdraw";
import { TooltipIcon } from "@/components/Tooltip";
import { SequencerStatus } from "@/hooks/rollup/useSequencerStatus";
import { useAlert } from "@/contexts/AlertContext";
import { getUnlockTimeDisplay } from "@/utils/dateFormatters";
import { MilestoneStatusBadge } from "@/components/MilestoneStatusBadge";

/**
 * Parse contract errors to extract user-friendly messages
 * Contract errors are often buried in the error object or masked by nonce errors
 */
function parseContractError(error: Error): string {
  const message = error.message || "";

  // Known contract error signatures and their user-friendly messages
  const errorMappings: Record<string, string> = {
    "Staking__NotExiting": "Sequencer is not in exiting state. Initiate unstake first.",
    "Staking__ExitDelayNotPassed": "Exit delay has not passed yet. Please wait for the withdrawal period to complete.",
    "Staking__WithdrawalDelayNotPassed": "Withdrawal delay has not passed yet. Please wait for the withdrawal period to complete.",
    "NotExiting": "Sequencer is not in exiting state.",
    "ExitDelayNotPassed": "Exit delay has not passed yet.",
    "0xef566ee0": "Exit delay has not passed yet. Please wait for the withdrawal period to complete.", // Staking__NotExiting selector
  };

  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (message.includes(pattern)) {
      return friendlyMessage;
    }
  }

  // Check for reverted errors that contain the actual reason
  const revertMatch = message.match(/reverted with.*?["']([^"']+)["']/i);
  if (revertMatch) {
    return revertMatch[1];
  }

  // Check for custom error data in the message
  const customErrorMatch = message.match(/error=\{[^}]*"data":"(0x[a-f0-9]+)"/i);
  if (customErrorMatch) {
    const errorData = customErrorMatch[1];
    // Check if this matches a known error selector
    for (const [selector, friendlyMessage] of Object.entries(errorMappings)) {
      if (errorData.startsWith(selector)) {
        return friendlyMessage;
      }
    }
  }

  // If we see nonce errors but there's also contract error data, the contract error is the real issue
  if (message.includes("nonce") && message.includes("0x")) {
    // Try to find error selector in the message
    const selectorMatch = message.match(/0x[a-f0-9]{8}/i);
    if (selectorMatch) {
      const selector = selectorMatch[0].toLowerCase();
      if (selector === "0xef566ee0") {
        return "Exit delay has not passed yet. Please wait for the withdrawal period to complete.";
      }
    }
    return "Transaction failed. The contract rejected the call - please check that all conditions are met.";
  }

  // Return original message if no pattern matched (but truncate if too long)
  if (message.length > 200) {
    return message.substring(0, 200) + "...";
  }

  return message || "Transaction failed";
}

interface WithdrawalActionsProps {
  stakerAddress: Address;
  attesterAddress: Address;
  rollupVersion: bigint;
  rollupAddress: Address;
  status: number | undefined;
  canFinalize: boolean;
  actualUnlockTime?: bigint;
  withdrawalDelayDays?: number;
  onSuccess?: () => void;
  // ATP context for milestone validation
  atpType?: string;
  registryAddress?: Address;
  milestoneId?: bigint;
}

/**
 * Component for withdrawal and unstake actions
 * Displays initiate unstake and finalize withdraw buttons with proper state management
 */
export const WithdrawalActions = ({
  stakerAddress,
  attesterAddress,
  rollupVersion,
  rollupAddress,
  status,
  canFinalize,
  actualUnlockTime,
  withdrawalDelayDays,
  onSuccess,
  // ATP context
  atpType,
  registryAddress,
  milestoneId,
}: WithdrawalActionsProps) => {
  const { showAlert } = useAlert();
  const isExiting = status === SequencerStatus.EXITING;

  const {
    initiateWithdraw,
    isPending: isInitiatingWithdraw,
    isConfirming: isConfirmingInitiate,
    isSuccess: isInitiateSuccess,
    error: initiateError,
    milestoneStatus,
    isMilestoneLoading,
    canWithdraw,
    milestoneBlockError,
  } = useInitiateWithdraw(stakerAddress, {
    registryAddress,
    milestoneId,
    atpType,
  });

  const {
    finalizeWithdraw,
    isPending: isFinalizingWithdraw,
    isConfirming: isConfirmingFinalize,
    isSuccess: isFinalizeSuccess,
    error: finalizeError,
  } = useFinalizeWithdraw();

  // Determine if milestone gates operations
  const isMATP = atpType === 'MATP';
  const isMilestoneGated = isMATP && !canWithdraw;

  const canInitiateUnstake =
    (status === SequencerStatus.VALIDATING || status === SequencerStatus.ZOMBIE)
    && !isMilestoneGated;  // Block if milestone not succeeded

  const canFinalizeWithdrawNow =
    canFinalize
    && !isMilestoneGated;  // Block if milestone not succeeded

  // Handle initiate withdraw errors
  useEffect(() => {
    if (initiateError) {
      const errorMessage = initiateError.message;
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        showAlert("warning", "Transaction was cancelled");
      }
    }
  }, [initiateError, showAlert]);

  // Handle finalize withdraw errors
  useEffect(() => {
    if (finalizeError) {
      const errorMessage = finalizeError.message;
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        showAlert("warning", "Transaction was cancelled");
      }
    }
  }, [finalizeError, showAlert]);

  // Call onSuccess callback when transaction succeeds
  useEffect(() => {
    if (isInitiateSuccess || isFinalizeSuccess) {
      onSuccess?.();
    }
  }, [isInitiateSuccess, isFinalizeSuccess, onSuccess]);

  const handleInitiateWithdraw = async () => {
    try {
      await initiateWithdraw(rollupVersion, attesterAddress);
    } catch (error) {
      console.error("Failed to initiate withdraw:", error);
    }
  };

  const handleFinalizeWithdraw = async () => {
    try {
      await finalizeWithdraw(attesterAddress, rollupAddress);
    } catch (error) {
      console.error("Failed to finalize withdraw:", error);
    }
  };

  return (
    <div className="pt-3 border-t border-parchment/10 space-y-2">
      <div className="flex items-center gap-1">
        <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
          Withdrawal Actions
        </div>
        <TooltipIcon
          content="To unstake, first initiate the unstake process. After the withdrawal period completes, you can finalize to receive your funds back to the Token Vault."
          size="sm"
          maxWidth="max-w-md"
        />
      </div>

      {/* Show milestone status for MATPs */}
      {isMATP && (
        <div className="mb-2">
          <MilestoneStatusBadge
            status={milestoneStatus}
            isLoading={isMilestoneLoading}
          />
        </div>
      )}

      {/* Show milestone error message */}
      {milestoneBlockError && (
        <div className="mb-2 p-3 border border-vermillion/40 bg-vermillion/10 rounded">
          <div className="text-xs text-vermillion">
            {milestoneBlockError}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <button
            onClick={handleInitiateWithdraw}
            disabled={
              !canInitiateUnstake ||
              isInitiatingWithdraw ||
              isConfirmingInitiate ||
              isMilestoneLoading
            }
            className="w-full bg-aqua text-ink py-1.5 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-aqua/90 transition-all disabled:opacity-50 disabled:hover:bg-aqua"
            title={
              isMilestoneGated
                ? milestoneBlockError || undefined
                : undefined
            }
          >
            {isInitiatingWithdraw
              ? "Confirming..."
              : isConfirmingInitiate
                ? "Initiating..."
                : "Initiate Unstake"}
          </button>
          <div className="flex items-center gap-1 mt-1">
            <TooltipIcon
              content="Starts the unstaking process. Only available when sequencer is Validating or Inactive. This begins the withdrawal waiting period."
              size="sm"
              maxWidth="max-w-xs"
            />
            <span className="text-[10px] text-parchment/50">
              Only available for Validating/Inactive status
            </span>
          </div>
        </div>
        <div className="flex-1">
          <button
            onClick={handleFinalizeWithdraw}
            disabled={
              !canFinalizeWithdrawNow || isFinalizingWithdraw || isConfirmingFinalize
            }
            className="w-full bg-chartreuse text-ink py-1.5 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:hover:bg-chartreuse"
            title={
              isMilestoneGated
                ? milestoneBlockError || undefined
                : undefined
            }
          >
            {isFinalizingWithdraw
              ? "Confirming..."
              : isConfirmingFinalize
                ? "Finalizing..."
                : "Finalize Withdraw"}
          </button>
          <div className="flex items-center gap-1 mt-1">
            <TooltipIcon
              content="Completes the withdrawal and returns funds to your Token Vault. Only available after the withdrawal waiting period has passed."
              size="sm"
              maxWidth="max-w-xs"
            />
            <span className="text-[10px] text-parchment/50">
              {getUnlockTimeDisplay({ isExiting, actualUnlockTime, withdrawalDelayDays })}
            </span>
          </div>
        </div>
      </div>

      {initiateError &&
        !(
          initiateError.message.includes("User rejected") ||
          initiateError.message.includes("rejected")
        ) && (
          <div className="bg-vermillion/10 border border-vermillion/20 p-3 rounded">
            <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">
              Transaction Error
            </div>
            <div className="text-xs text-parchment/80">
              {parseContractError(initiateError)}
            </div>
          </div>
        )}

      {finalizeError &&
        !(
          finalizeError.message.includes("User rejected") ||
          finalizeError.message.includes("rejected")
        ) && (
          <div className="bg-vermillion/10 border border-vermillion/20 p-3 rounded">
            <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">
              Transaction Error
            </div>
            <div className="text-xs text-parchment/80">
              {parseContractError(finalizeError)}
            </div>
          </div>
        )}

      {(isInitiateSuccess || isFinalizeSuccess) && (
        <div className="bg-chartreuse/10 border border-chartreuse/20 p-3 rounded">
          <div className="text-xs font-oracle-standard font-bold text-chartreuse uppercase tracking-wide">
            {isInitiateSuccess ? "Unstake Initiated" : "Withdrawal Finalized"}
          </div>
        </div>
      )}
    </div>
  );
};
