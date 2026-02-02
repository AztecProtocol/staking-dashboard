import type { Address } from "viem";
import { zeroAddress } from "viem";
import { formatAddress } from "../../utils/formatAddress";
import styles from "./StepSetOperator.module.css";

interface SetOperatorProps {
  beneficiary?: Address;
  currentOperator?: Address;
  isLoading?: boolean;
  error?: string;
  isCompleted?: boolean;
  canExecute?: boolean;
  onSetOperator: (operatorAddress: Address) => void;
}

export default function StepSetOperator({
  beneficiary,
  currentOperator,
  isLoading = false,
  error,
  isCompleted = false,
  canExecute = true,
  onSetOperator,
}: SetOperatorProps) {
  const handleSetOperator = () => {
    if (beneficiary) {
      onSetOperator(beneficiary);
    }
  };

  const isOperatorAlreadySet =
    currentOperator && currentOperator !== zeroAddress;
  const canSet = canExecute && beneficiary && !isLoading && !isCompleted;

  return (
    <div className={styles.operatorContainer}>
      <div className={styles.stepDescription}>
        Operator address will have (un)staking rights for your ATP. This is by
        default owner of this ATP. If you want to change it to other address,
        follow our docs...
      </div>
      <div className={styles.operatorDisplay}>
        <div className={styles.operatorInfo}>
          {isOperatorAlreadySet ? (
            <span className={styles.currentOperator}>
              <span className={styles.currentOperatorValue}>
                {formatAddress(currentOperator)}
              </span>{" "}
              (Currently set)
            </span>
          ) : (
            <span className={styles.operatorValue}>
              {beneficiary ? formatAddress(beneficiary) : "Not connected"}
            </span>
          )}
        </div>
        <button
          className={`btn-primary ${isCompleted ? styles.operatorSetButton : ""}`}
          onClick={handleSetOperator}
          disabled={!canSet || isOperatorAlreadySet}
        >
          {isCompleted || isOperatorAlreadySet ? (
            <div className={styles.operatorSetStatus}>Operator set ✓</div>
          ) : isLoading ? (
            "Setting operator..."
          ) : (
            "Set Operator"
          )}
        </button>
      </div>
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
}
