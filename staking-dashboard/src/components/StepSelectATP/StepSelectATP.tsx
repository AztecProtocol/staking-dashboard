import type { MATPData } from "../../hooks/atp/matp";
import { useATP } from "../../hooks/useATP";
import { mockATPs } from "../../data/mockATPs";
import ATPOption from "../ATPOption/ATPOption";
import styles from "./StepSelectATP.module.css";
import type { StepStatus } from "../../utils/stakingSteps";

interface StepSelectATPProps {
  selectedATP: MATPData | null;
  onSelectATP: (atp: MATPData) => void;
  canExecute: boolean;
  stepStatus: StepStatus;
}

export default function StepSelectATP({
  selectedATP,
  onSelectATP,
  canExecute,
  stepStatus,
}: StepSelectATPProps) {
  const { atpData: matpData } = useATP();

  // Combine real and mock ATP data for demo purposes
  const combinedATPs: MATPData[] = [...matpData, ...mockATPs];

  return (
    <div className={`${styles.stepContent} ${styles[stepStatus]}`}>
      <div className={styles.atpSelection}>
        <div className={styles.atpOptions}>
          {combinedATPs.map((atp, index) => (
            <ATPOption
              key={`${atp.atpAddress}-${index}`}
              atp={atp}
              isSelected={selectedATP?.atpAddress === atp.atpAddress}
              onClick={() => canExecute && onSelectATP(atp)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
