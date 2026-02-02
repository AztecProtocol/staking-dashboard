import styles from "./StakeMethodSelectionModal.module.css";
import { createPortal } from "react-dom";

interface StakeMethodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDelegateStaking: () => void;
  onSelectValidatorRegistration: () => void;
}

export default function StakeMethodSelectionModal({
  isOpen,
  onClose,
  onSelectDelegateStaking,
  onSelectValidatorRegistration,
}: StakeMethodSelectionModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`${styles.modalContent} modal-content-base`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <div className={styles.modalBody}>
          <h2>Choose Your Staking Method</h2>
          <div className={styles.stakingOptions}>
            <div
              className={styles.stakingOption}
              onClick={onSelectDelegateStaking}
            >
              <div className={styles.optionIcon}>🤝</div>
              <div className={styles.optionContent}>
                <h3>Delegate to Provider</h3>
                <p>
                  Delegate your tokens to an existing provider. This is
                  perfect if you don't want to run your own infrastructure.
                </p>
                <ul>
                  <li>No technical setup required</li>
                  <li>Choose from established providers</li>
                </ul>
              </div>
            </div>

            <div
              className={styles.stakingOption}
              onClick={onSelectValidatorRegistration}
            >
              <div className={styles.optionIcon}>⚙️</div>
              <div className={styles.optionContent}>
                <h3>Register Your Validator</h3>
                <p>
                  Register as an operator if you're already running your own
                  validator and want others to delegate to you.
                </p>
                <ul>
                  <li>Requires running validator infrastructure</li>
                  <li>Higher potential rewards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
