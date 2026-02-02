import styles from "./ATPOption.module.css";
import type { MATPData } from "../../hooks/atp/matp";
import { formatCompact } from "../../utils/formatNumber";

interface ATPOptionProps {
  atp: MATPData;
  isSelected: boolean;
  onClick: () => void;
}

export default function ATPOption({
  atp,
  isSelected,
  onClick,
}: ATPOptionProps) {
  const getTypeName = (type: number | undefined) => {
    switch (type) {
      case 1:
        return "Milestone ATP";
      case 2:
        return "Linear ATP";
      default:
        return "Unknown ATP";
    }
  };

  // Helper function to identify mock data (using placeholder address pattern)
  const isMockATP = (atp: MATPData) => {
    return (
      atp.atpAddress.startsWith("0x1234567890") ||
      atp.atpAddress.startsWith("0x9876543210")
    );
  };

  return (
    <div
      className={`${styles.atpOption} ${isSelected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <div className={styles.atpOptionHeader}>
        <div className={styles.atpLeftColumn}>
          <div className={styles.atpType}>
            {getTypeName(atp.type)} ({formatCompact(atp.allocation)} AZTEC)
          </div>
          <div className={styles.atpOptionDetails}>
            <span className={`${styles.stakedAmount} ${styles.canStakeText}`}>
              • You can stake <b>{formatCompact(atp.claimable)} AZTEC</b> {atp.claimable}
            </span>
          </div>
          <div className={styles.atpOptionDetails}>
            <span className={styles.stakedAmount}>
              • Already claimed <b>{formatCompact(atp.claimed)} AZTEC</b>
            </span>
          </div>
          <div className={styles.atpOptionDetails}>
            <span
              className={`${styles.atpBadge} ${isMockATP(atp) ? styles.mockBadge : styles.realBadge}`}
            >
              {isMockATP(atp) ? "MOCK" : "REAL"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
