import { useState, useMemo } from "react";
import ProvidersTable from "../../components/ProvidersTable/ProvidersTable";
import DelegateModal from "../../components/DelegateModal/DelegateModal";
import mockProvidersData from "../../data/mockProviders.json";
import styles from "./Providers.module.css";

interface Provider {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  currentStake: string;
  commission: number;
  description: string;
  delegators: number;
  website: string;
}

const mockProviders: Provider[] = mockProvidersData;

export default function Providers() {
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Provider | null>(
    null,
  );

  // Precompute the minimum stake threshold for top providers
  const topProviderStakeThreshold = useMemo(() => {
    const topCount = 10;
    if (mockProviders.length <= topCount) return 0;

    const sortedByStake = [...mockProviders]
      .sort((a, b) => parseFloat(b.currentStake) - parseFloat(a.currentStake))
      .slice(0, topCount);

    return parseFloat(sortedByStake[topCount - 1].currentStake);
  }, []);

  const handleStake = (provider: Provider) => {
    setSelectedOperator(provider);
    setShowDelegateModal(true);
  };

  const handleCloseDelegateModal = () => {
    setShowDelegateModal(false);
    setSelectedOperator(null);
  };

  return (
    <div className={`page-content ${styles.providersPage}`}>
      <DelegateModal
        isOpen={showDelegateModal}
        provider={selectedOperator}
        topProviderStakeThreshold={topProviderStakeThreshold}
        onClose={handleCloseDelegateModal}
      />

      <div className={styles.providersContent}>
        <div className={`page-header ${styles.sectionHeader}`}>
          <div>
            <h2>Delegate Stake</h2>
            <p>
              Choose a provider to delegate your tokens. This is for users
              that don't want to run their own infrastructure.
            </p>
          </div>
        </div>

        <ProvidersTable providers={mockProviders} onStake={handleStake} />
      </div>
    </div>
  );
}
