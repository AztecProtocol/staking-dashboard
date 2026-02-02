import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div></div> {/* Placeholder for future header content */}
        <div className={styles.headerWallet}>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
