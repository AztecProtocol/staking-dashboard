import type { Address } from "viem";
import { formatAddress } from "../../utils/formatAddress";
import {
  getImplementationDescription,
  getVersionByImplementation,
  implementationSupportsStaking,
  getImplementationForVersion,
} from "../../utils/stakerVersion";
import styles from "./StepSetStakerVersion.module.css";

interface SetStakerVersionProps {
  implementations: Record<number, Address | undefined>;
  selectedVersion: bigint | null;
  currentImplementation?: Address;
  isLoading?: boolean;
  isLoadingVersions?: boolean;
  error?: string;
  isCompleted?: boolean;
  canExecute?: boolean;
  onVersionChange: (version: bigint) => void;
  onSetVersion: () => void;
}

export default function StepSetStakerVersion({
  implementations,
  selectedVersion,
  currentImplementation,
  isLoading = false,
  isLoadingVersions = false,
  error,
  // isCompleted = false,
  canExecute = true,
  onVersionChange,
  onSetVersion,
}: SetStakerVersionProps) {
  // Derive staker versions from implementations object
  const stakerVersions = Object.keys(implementations)
    .map((version) => BigInt(version))
    .sort((a, b) => Number(a - b)); // Sort versions in ascending order

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onVersionChange(BigInt(e.target.value));
  };

  const handleSetVersion = () => {
    if (selectedVersion !== null) {
      onSetVersion();
    }
  };

  const currentVersion = getVersionByImplementation(
    currentImplementation,
    implementations,
  );

  const isVersionAlreadySet =
    currentVersion !== null &&
    selectedVersion !== null &&
    currentVersion === selectedVersion;

  const selectedImplementation =
    selectedVersion !== null
      ? getImplementationForVersion(selectedVersion, implementations)
      : undefined;
  const doesSupportStaking = selectedImplementation
    ? implementationSupportsStaking(selectedImplementation, implementations)
    : false;

  const canSet =
    canExecute &&
    selectedVersion !== null &&
    !isLoading &&
    !isLoadingVersions &&
    !isVersionAlreadySet &&
    doesSupportStaking;

  return (
    <div className={styles.versionContainer}>
      <div className={styles.stepDescription}>
        Latest version includes newest features and security updates. Version 0
        doesn't support staking therefore you must chose version higher than 0
        in order to stake. Read more about staker versions in ...
        {currentImplementation && (
          <div className={styles.currentVersion}>
            Current implementation:{" "}
            <span>
              {currentVersion !== null
                ? `Version ${currentVersion}`
                : "Null version"}
            </span>{" "}
            <span className={styles.currentImplementationAddress}>
              ({formatAddress(currentImplementation)})
            </span>
          </div>
        )}
      </div>
      <div className={styles.inputWithButton}>
        <div className={styles.inputSection}>
          <select
            id="staker-version"
            className={styles.stakerVersionSelect}
            value={selectedVersion?.toString() || ""}
            onChange={handleVersionChange}
            disabled={isLoading}
          >
            {isLoading ? (
              <option>Loading versions...</option>
            ) : (
              stakerVersions.map((version, index) => {
                const implementation = getImplementationForVersion(
                  version,
                  implementations,
                );
                return (
                  <option key={version.toString()} value={version.toString()}>
                    {version.toString()} -{" "}
                    {getImplementationDescription(implementation)}{" "}
                    {index === stakerVersions.length - 1 ? "(Latest)" : ""}
                  </option>
                );
              })
            )}
          </select>
        </div>
        <button
          className={`btn-primary ${styles.versionSetButton} ${selectedVersion !== null && !doesSupportStaking ? styles.dangerButton : ""}`}
          onClick={handleSetVersion}
          disabled={
            !canSet && !(selectedVersion !== null && !doesSupportStaking)
          }
        >
          {isLoading
            ? "Upgrading..."
            : selectedVersion !== null && !doesSupportStaking
              ? "Doesn't allow staking"
              : isVersionAlreadySet
                ? "Already set"
                : "Set version"}
        </button>
      </div>
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
}
