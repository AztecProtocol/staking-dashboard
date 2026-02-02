// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import { useAccount } from "wagmi";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import WelcomeModal from "../components/WelcomeModal/WelcomeModal";
import { useFirstTimeVisitor } from "../hooks";
import styles from "./MainLayout.module.css";

export default function MainLayout() {
  const { isConnected } = useAccount();
  const { isFirstVisit, markAsVisited } = useFirstTimeVisitor();

  const handleCloseWelcomeModal = () => {
    markAsVisited();
  };

  const handleConnectWallet = () => {
    // This will be handled by the ConnectButton component itself
    markAsVisited();
  };

  const shouldShowWelcomeModal = isFirstVisit && !isConnected;

  return (
    <div className={styles.layout}>
      <WelcomeModal
        isOpen={shouldShowWelcomeModal}
        onClose={handleCloseWelcomeModal}
        onConnectWallet={handleConnectWallet}
      />

      <div className={styles.sidebarCol}>
        <Sidebar />
      </div>

      <div className={styles.header}>
        <Header />
      </div>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
