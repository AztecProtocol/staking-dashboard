import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./WelcomeModal.module.css";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectWallet: () => void;
}

export default function WelcomeModal({
  isOpen,
  onClose,
  onConnectWallet,
}: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`${styles.modalContent} modal-content-base`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <div className={styles.modalBody}>
          <h2>Welcome to ATP Staking</h2>
          <p>Welcome to the ATP (Aztec Token Position) staking platform.</p>
          <p>
            Here you can stake your ATP to help secure the Aztec network and
            earn rewards.
          </p>

          <h3>How ATP Staking Works</h3>
          <p>ATP staking allows you to:</p>
          <ul>
            <li>
              Either delegate your ATP tokens to trusted provider or stake to
              your own node{" "}
            </li>
            <li>Earn rewards for participating in network security</li>
            <li>Support the decentralization of the Aztec network</li>
          </ul>

          <h3>Getting Started</h3>
          <p>To start staking:</p>
          <ol>
            <li>Connect your Ethereum wallet</li>
            <li>Choose an operator to delegate to</li>
            <li>Approve and stake your ATP tokens</li>
          </ol>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.modalActions}>
            <button className="btn-secondary" onClick={onClose}>
              Skip for now
            </button>
            <div onClick={onConnectWallet}>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
