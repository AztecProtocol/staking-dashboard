import { useState, useEffect } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import StepSetOperator from "../StepSetOperator/StepSetOperator";
import type { MATPData } from "../../hooks/atp/matp";
import { useUpdateStakerOperator } from "../../hooks/atp/useUpdateStakerOperator";
import { formatAddress } from "../../utils/formatAddress";
import styles from "./SetOperatorModal.module.css";

interface SetOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  atp: MATPData | null;
  onSuccess?: () => void; // TODO: Implement data refetch
}

export default function SetOperatorModal({
  isOpen,
  onClose,
  atp,
}: SetOperatorModalProps) {
  const { address } = useAccount();
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize the updateStakerOperator hook
  const updateOperatorHook = useUpdateStakerOperator(
    atp?.atpAddress as Address,
  );

  // Monitor transaction states
  useEffect(() => {
    if (updateOperatorHook.isSuccess) {
      console.log("✅ Set operator transaction successful!");
      console.log("Transaction Hash:", updateOperatorHook.txHash);
      console.log("Transaction Status: success");
      setIsCompleted(true);
    } else if (updateOperatorHook.error) {
      console.error("❌ Set operator transaction failed:");
      console.error("Error:", updateOperatorHook.error.message);
    }
  }, [
    updateOperatorHook.isSuccess,
    updateOperatorHook.error,
    updateOperatorHook.txHash,
  ]);

  useEffect(() => {
    if (updateOperatorHook.isPending) {
      console.log("⏳ Set operator transaction is pending...");
    }
  }, [updateOperatorHook.isPending]);

  const getTypeName = (atp: MATPData) => {
    switch (atp.type) {
      case 1:
        return "Milestone ATP";
      case 2:
        return "Linear ATP";
      default:
        return "Unknown ATP";
    }
  };

  if (!isOpen || !atp) return null;

  const handleSetOperator = async (operatorAddress: Address) => {
    if (!address || !atp) return;

    try {
      console.log(
        "Sending updateStakerOperator transaction with operator:",
        operatorAddress,
      );

      // Call the real updateStakerOperator function
      updateOperatorHook.updateStakerOperator(operatorAddress);

      // Transaction state monitoring is handled in useEffect hooks
    } catch (error) {
      console.error("❌ Error setting operator:", error);
    }
  };

  const handleClose = () => {
    setIsCompleted(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`${styles.modalContent} modal-content-base`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose}>
          ×
        </button>

        <div className={styles.modalBody}>
          <div className={styles.atpDetailsSection}>
            <div className={styles.sectionHeader}>
              <h2>Set Token Vault Operator</h2>
              <div className={styles.atpBadge}>
                <span className={styles.atpType}>{getTypeName(atp)}</span>
                {atp.milestoneId !== undefined && (
                  <span className={styles.milestoneId}>
                    Milestone {atp.milestoneId.toString()}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.description}>
              <p>
                The ATP operator has staking rights for this ATP. By default,
                the operator will be set to the owner of this ATP.
              </p>
              <p>
                To set an operator different than the ATP owner (beneficiary),
                please refer to the documentation for advanced configuration
                options.
              </p>
            </div>

            <div className={styles.atpInfoGrid}>
              <div className={styles.infoCard}>
                <h5 className={styles.infoLabel}>Allocation</h5>
                <p className={styles.infoValue}>
                  {atp.allocation
                    ? Number(formatEther(atp.allocation)).toLocaleString()
                    : "0"}{" "}
                  AZTEC
                </p>
              </div>

              <div className={styles.infoCard}>
                <h5 className={styles.infoLabel}>ATP Address</h5>
                <p className={styles.infoValueCode}>
                  {formatAddress(atp.atpAddress)}
                </p>
              </div>

              <div className={styles.infoCard}>
                <h5 className={styles.infoLabel}>Current Operator</h5>
                <p className={styles.infoValueCode}>
                  {atp.operator === "0x0000000000000000000000000000000000000000"
                    ? "Not set"
                    : formatAddress(atp.operator!)}
                </p>
              </div>

              <div className={styles.infoCard}>
                <h5 className={styles.infoLabel}>Beneficiary</h5>
                <p className={styles.infoValueCode}>
                  {atp.beneficiary ? formatAddress(atp.beneficiary) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.operatorSection}>
            <h3 className={styles.operatorSectionTitle}>New operator</h3>
            <StepSetOperator
              beneficiary={address}
              currentOperator={atp.operator as Address}
              isLoading={updateOperatorHook.isPending}
              error={updateOperatorHook.error?.message}
              isCompleted={isCompleted}
              canExecute={!!address}
              onSetOperator={handleSetOperator}
            />

            {isCompleted && (
              <div className={styles.successMessage}>
                Operator successfully set! You can now close this modal.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
