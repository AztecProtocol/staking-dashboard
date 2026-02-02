import styles from "./StepStake.module.css";
import { formatCompact } from "../../utils/formatNumber";

interface StakeProps {
  allocation?: bigint;
  activationThreshold?: bigint;
  isLoading?: boolean;
  error?: string;
  canExecute?: boolean;
  isSuccess?: boolean;
  onStake: (stakeNumber: number) => void;
}

export default function StepStake({
  allocation,
  activationThreshold,
  isLoading = false,
  error,
  canExecute = true,
  isSuccess = false,
  onStake,
}: StakeProps) {
  // Calculate number of stake buttons based on allocation / activationThreshold
  const maxStakeTimes =
    allocation && activationThreshold
      ? Number(allocation / activationThreshold)
      : 0;

  const handleStake = (stakeNumber: number) => {
    if (canExecute) {
      onStake(stakeNumber);
    }
  };

  const canStakeTokens = canExecute && !isLoading;

  return (
    <div className={styles.stakeContainer}>
      <div className={styles.stepDescription}>
        Stake your AZTEC tokens. Staking minimal amount multiple times will give
        you better rewards than staking all at once.
      </div>
      {isSuccess && (
        <div className={styles.successMessage}>
          Stake transaction confirmed successfully!
        </div>
      )}
      <div className={styles.stakeButtonsGrid}>
        {Array.from({ length: maxStakeTimes }, (_, i) => (
          <button
            key={i + 1}
            className={`btn-primary ${styles.stakeButton}`}
            onClick={() => handleStake(i + 1)}
            disabled={!canStakeTokens}
          >
            {isLoading
              ? "Staking..."
              : `Stake ${formatCompact(activationThreshold || BigInt(0))} AZTEC`}
          </button>
        ))}
      </div>
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
}
