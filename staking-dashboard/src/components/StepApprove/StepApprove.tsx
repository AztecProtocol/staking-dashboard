import { useEffect } from "react";
import { formatEther } from "viem";
import styles from "./StepApprove.module.css";

interface ApproveProps {
  allocation?: bigint;
  activationThreshold?: bigint;
  currentAllowance?: bigint;
  isLoading?: boolean;
  error?: string;
  isCompleted?: boolean;
  canExecute?: boolean;
  onApprove: () => void;
  onStepComplete?: () => void;
}

export default function StepApprove({
  allocation,
  activationThreshold,
  currentAllowance,
  isLoading = false,
  error,
  isCompleted = false,
  canExecute = true,
  onApprove,
  onStepComplete,
}: ApproveProps) {
  const handleApprove = () => {
    if (allocation && canExecute) {
      onApprove();
    }
  };

  const canApprove = canExecute && allocation && !isLoading && !isCompleted;

  // Check if allowance is sufficient
  const isAllowanceSufficient =
    currentAllowance !== undefined &&
    activationThreshold !== undefined &&
    currentAllowance >= activationThreshold;

  // Check if current allowance is sufficient and mark step as completed
  useEffect(() => {
    if (
      currentAllowance !== undefined &&
      activationThreshold !== undefined &&
      currentAllowance >= activationThreshold &&
      !isCompleted &&
      onStepComplete
    ) {
      onStepComplete(); // Mark the approve step as completed
    }
  }, [currentAllowance, activationThreshold, isCompleted, onStepComplete]);

  return (
    <div className={styles.approveContainer}>
      <div className={styles.stepDescription}>
        Approve Staker contract to spend your AZTEC tokens (Current allowance is{" "}
        <strong>
          {Number(formatEther(currentAllowance || BigInt(0))).toLocaleString()}
        </strong>{" "}
        AZTEC)
      </div>

      <button
        className={`btn-primary ${styles.approveButton}`}
        onClick={handleApprove}
        disabled={!canApprove}
      >
        {isLoading
          ? "Approving..."
          : isAllowanceSufficient
            ? "Sufficient Allowance ✓"
            : "Approve"}
      </button>
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
}
