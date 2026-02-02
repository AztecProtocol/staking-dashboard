import { formatEther } from "viem";
import { useState } from "react";
import styles from "./ATPCard.module.css";
import { formatAddress } from "../../utils/formatAddress";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import type { ATPData } from "../../hooks/atp/atpTypes";

interface CopyButtonProps {
  address: string;
}

function CopyButton({ address }: CopyButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      console.log("Failed to copy", err);
    }
  };

  const handleClick = async () => {
    await copyToClipboard(address);
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        opacity: 0.4,
        transition: "opacity 0.2s ease",
        display: "flex",
        alignItems: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.4";
      }}
    >
      {isClicked ? (
        <IconCheck size={12} style={{ color: "green" }} />
      ) : (
        <IconCopy size={12} />
      )}
    </button>
  );
}

interface ATPCardProps {
  atp: ATPData;
  index: number;
  onStakeClick: () => void;
  onSetOperator: (atp: ATPData) => void;
}

export default function ATPCard({
  atp,
  index,
  onStakeClick,
  onSetOperator,
}: ATPCardProps) {
  // Helper function to identify mock data (using placeholder address pattern)
  const isMockATP = (atp: ATPData) => {
    return (
      atp.atpAddress.startsWith("0x1234567890") ||
      atp.atpAddress.startsWith("0x9876543210")
    );
  };

  const isOperatorNotSet = (operator?: string) => {
    return (
      !operator || operator === "0x0000000000000000000000000000000000000000"
    );
  };

  const getTypeName = (atp: ATPData) => {
    switch (atp.typeString) {
      case 'MATP':
        return "Milestone ATP";
      case 'LATP':
        return "Linear ATP";
      default:
        return "Unknown ATP";
    }
  };

  const getStakeableAmount = (atp: ATPData) => {
    // We can stake the claimable amount
    if (atp.claimable) {
      return Number(formatEther(atp.claimable)).toLocaleString();
    }
    // If we had allocation data, we could use that as maximum stakeable
    if (atp.allocation) {
      return Number(formatEther(atp.allocation)).toLocaleString();
    }
    return "0";
  };

  // Calculate time left to claim for each ATP
  const getTimeToClaimForATP = (atp: ATPData) => {
    // Use globalLock data if available
    if (atp.globalLock?.endTime) {
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(atp.globalLock.endTime);
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        return "Available now";
      }

      const days = Math.floor(timeLeft / (24 * 60 * 60));

      return `${days} days`;
    }

    // Fallback for ATPs without lock data
    return "Available now";
  };

  return (
    <div key={`${atp.atpAddress}-${index}`} className={styles.atpCard}>
      <div className={styles.atpCardHeader}>
        <div className={styles.atpTitle}>
          <h3>{getTypeName(atp)}</h3>
        </div>
        <div className={styles.atpAllocation}>
          <span className={styles.allocationAmount}>
            {atp.allocation
              ? Number(formatEther(atp.allocation)).toLocaleString()
              : "0"}
          </span>
          {/* <span className={styles.allocationUnit}>AZTEC</span> */}
        </div>
      </div>

      <div className={styles.milestoneBadgeRow}>
        {atp.milestoneId !== undefined && (
          <span className={styles.milestoneTag}>
            Milestone {atp.milestoneId.toString()}
          </span>
        )}
        <span
          className={`${styles.atpTag} ${isMockATP(atp) ? styles.mockTag : styles.realTag}`}
        >
          {isMockATP(atp) ? "MOCK" : "REAL"}
        </span>
      </div>

      <div className={styles.atpBreakdown}>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Claimable</span>
          <span className={styles.breakdownValue}>
            {atp.claimable
              ? Number(formatEther(atp.claimable)).toLocaleString()
              : "0"}{" "}
            AZTEC
          </span>
        </div>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Claimed</span>
          <span className={styles.breakdownValue}>
            {atp.claimed
              ? Number(formatEther(atp.claimed)).toLocaleString()
              : "0"}{" "}
            AZTEC
          </span>
        </div>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Claimable in</span>
          <span className={styles.breakdownValue}>
            {getTimeToClaimForATP(atp)}
          </span>
        </div>
      </div>
      <div className={styles.atpDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>ATP Address</span>
          <div className={styles.operatorSection}>
            <span className={styles.detailValue}>
              <span>{formatAddress(atp.atpAddress)}</span>
              <CopyButton address={atp.atpAddress} />
            </span>
          </div>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Beneficiary</span>
          <div className={styles.operatorSection}>
            <span className={styles.detailValue}>
              <span>
                {atp.beneficiary ? formatAddress(atp.beneficiary) : "N/A"}
              </span>
              {atp.beneficiary && <CopyButton address={atp.beneficiary} />}
            </span>
          </div>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Operator</span>
          <div className={styles.operatorSection}>
            <span className={styles.detailValue}>
              <span>
                {isOperatorNotSet(atp.operator)
                  ? "Not set"
                  : formatAddress(atp.operator!)}
              </span>
              {!isOperatorNotSet(atp.operator) && (
                <CopyButton address={atp.operator!} />
              )}
            </span>
            {isOperatorNotSet(atp.operator) && (
              <button
                className="btn-outline"
                onClick={() => onSetOperator(atp)}
                style={{
                  marginLeft: "var(--spacing-sm)",
                  fontSize: "var(--font-size-xs)",
                  padding: "4px 8px",
                }}
              >
                Set Operator
              </button>
            )}
          </div>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Staker Contract</span>
          <div className={styles.operatorSection}>
            <span className={styles.detailValue}>
              <span>{atp.staker ? formatAddress(atp.staker) : "N/A"}</span>
              {atp.staker && <CopyButton address={atp.staker} />}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.atpActions}>
        <button
          className={`btn-primary ${styles.stakeButton}`}
          onClick={onStakeClick}
        >
          Stake up to {getStakeableAmount(atp)} AZTEC
        </button>
      </div>
    </div>
  );
}
