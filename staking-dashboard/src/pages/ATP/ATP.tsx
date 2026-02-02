import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useNavigate } from "react-router-dom";
import styles from "./ATP.module.css";
import StakeMethodSelectionModal from "../../components/StakeMethodSelectionModal/StakeMethodSelectionModal";
import SetOperatorModal from "../../components/SetOperatorModal/SetOperatorModal";
import ATPCard from "../../components/ATPCard/ATPCard";
import ATPCardSkeleton from "../../components/ATPCardSkeleton/ATPCardSkeleton";
import { useATP } from "../../hooks/useATP";
import type { ATPData } from "../../hooks/atp";
import { mockATPs } from "../../data/mockATPs";

export default function ATP() {
  const { isConnected } = useAccount();
  const { atpData: matpData, isLoadingAtpData: isLoadingHoldings } = useATP();
  const navigate = useNavigate();
  const [showStakingOptionsModal, setShowStakingOptionsModal] = useState(false);
  const [showSetOperatorModal, setShowSetOperatorModal] = useState(false);
  const [selectedATP, setSelectedATP] = useState<ATPData | null>(null);

  const handleCloseStakingOptionsModal = () => {
    setShowStakingOptionsModal(false);
  };

  const handleChooseDelegate = () => {
    setShowStakingOptionsModal(false);
    navigate("/providers");
  };

  const handleChooseOwnValidator = () => {
    setShowStakingOptionsModal(false);
    navigate("/register-validator");
  };

  const handleStakeClick = () => {
    setShowStakingOptionsModal(true);
  };

  const handleSetOperator = (atp: ATPData) => {
    setSelectedATP(atp);
    setShowSetOperatorModal(true);
  };

  const handleCloseSetOperatorModal = () => {
    setShowSetOperatorModal(false);
    setSelectedATP(null);
  };

  return (
    <div className={`page-content ${styles.atpPage}`}>
      <StakeMethodSelectionModal
        isOpen={showStakingOptionsModal}
        onClose={handleCloseStakingOptionsModal}
        onSelectDelegateStaking={handleChooseDelegate}
        onSelectValidatorRegistration={handleChooseOwnValidator}
      />

      <SetOperatorModal
        isOpen={showSetOperatorModal}
        onClose={handleCloseSetOperatorModal}
        atp={selectedATP}
      />

      <div className={styles.atpContent}>
        <div className={`page-header ${styles.sectionHeader}`}>
          <h2>My Aztec Token Positions</h2>
          <p>
            Aztec Token Position (ATP) is a representation of your AZTEC token
            holdings.
          </p>
        </div>

        {!isConnected ? (
          <div className={styles.portfolioMessage}>
            <p>Connect your wallet to view your ATP holdings</p>
            <ConnectButton />
          </div>
        ) : (
          <div className={styles.portfolioDetails}>
            <div className={styles.atpHoldings}>
              {/* Show real ATPs first */}
              {matpData.map((atp, index) => (
                <ATPCard
                  key={`real-${atp.atpAddress}-${index}`}
                  atp={atp}
                  index={index}
                  onStakeClick={handleStakeClick}
                  onSetOperator={handleSetOperator}
                />
              ))}

              {/* Show skeleton only when loading real ATPs */}
              {isLoadingHoldings && <ATPCardSkeleton />}

              {/* Show mock ATPs last */}
              {mockATPs.map((atp, index) => (
                <ATPCard
                  key={`mock-${atp.atpAddress}-${index}`}
                  atp={atp}
                  index={matpData.length + index}
                  onStakeClick={handleStakeClick}
                  onSetOperator={handleSetOperator}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
