import { isAddress } from "viem";
import styles from "./StepSetValidatorAddress.module.css";

interface StepSetValidatorAddressProps {
  validatorAddress: string;
  isValidatorRunning: boolean;
  canExecute?: boolean;
  onValidatorAddressChange: (address: string) => void;
  onValidatorRunningChange: (running: boolean) => void;
}

export default function StepSetValidatorAddress({
  validatorAddress,
  isValidatorRunning,
  canExecute = true,
  onValidatorAddressChange,
  onValidatorRunningChange,
}: StepSetValidatorAddressProps) {
  const canInput = canExecute;

  return (
    <div className={styles.validatorContainer}>
      <div className={styles.stepDescription}>
        Want to run a validator?{" "}
        <a
          href="https://docs.aztec.network/validators"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.docsLink}
        >
          Follow our docs →
        </a>
      </div>

      <div className={styles.inputWithButton}>
        <div className={styles.inputSection}>
          <input
            id="validator-address"
            type="text"
            value={validatorAddress}
            onChange={(e) => onValidatorAddressChange(e.target.value)}
            placeholder="0x..."
            disabled={!canInput}
            className={
              validatorAddress && !isAddress(validatorAddress)
                ? styles.invalid
                : ""
            }
          />
          {validatorAddress && !isAddress(validatorAddress) && (
            <span className={styles.errorText}>
              Please enter a valid Ethereum address
            </span>
          )}
        </div>
      </div>

      <div className={styles.checkboxSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isValidatorRunning}
            onChange={(e) => onValidatorRunningChange(e.target.checked)}
            disabled={!canInput}
          />
          My validator is up and running
        </label>
      </div>
    </div>
  );
}
