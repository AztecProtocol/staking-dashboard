import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
import {
  DELEGATION_STEP_IDS as STEPS,
  getStepIcon,
  getStepIndex,
} from "../../utils/stakingSteps";
import { useStakingSteps } from "../../hooks/useStakingSteps";
import { useTransactionManager } from "../../hooks/useTransactionManager";
import StepSelectATP from "../StepSelectATP/StepSelectATP";
import StepSetOperator from "../StepSetOperator/StepSetOperator";
import StepSetStakerVersion from "../StepSetStakerVersion/StepSetStakerVersion";
import StepApprove from "../StepApprove/StepApprove";
import StepStake from "../StepStake/StepStake";
import { formatNumber } from "../../utils/formatNumber";
import { useATP } from "../../hooks/useATP";
import type { MATPData } from "../../hooks/atp/matp";
import { useUpdateStakerOperator } from "../../hooks/atp/useUpdateStakerOperator";
import { useUpgradeStaker } from "../../hooks/atp/useUpgradeStaker";
import { useApproveStaker } from "../../hooks/atp/useApproveStaker";
import {
  useAtpRegistryData,
  useStakerImplementations,
} from "../../hooks/atpRegistry";
import { useProviderConfigurations } from "../../hooks/stakingRegistry";
import { useStakeWithProvider } from "../../hooks/staker/useStakeWithProvider";
import { useRollupData } from "../../hooks/rollup";
import { useAllowance } from "../../hooks/erc20/useAllowance";
import { useStakerImplementation } from "../../hooks/staker/useStakerImplementation";
import { implementationSupportsStaking } from "../../utils/stakerVersion";
import styles from "./DelegateModal.module.css";
import { IconLink } from "@tabler/icons-react";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import TakeRateDisplay from "../TakeRateDisplay";

interface DelegateModalProps {
  isOpen: boolean;
  provider: Provider | null;
  topProviderStakeThreshold: number;
  onClose: () => void;
}

export default function DelegateModal({
  isOpen,
  provider,
  topProviderStakeThreshold,
  onClose,
}: DelegateModalProps) {
  const { isConnected, address: beneficiary } = useAccount();
  const { atpData: matpData, refetchAtpData: refetchMatpData } = useATP();
  const [selectedATP, setSelectedATP] = useState<MATPData | null>(null);

  // Get the current ATP data from matpData to ensure we have fresh data after refetch
  const currentATPData = selectedATP
    ? matpData.find((atp) => atp.atpAddress === selectedATP.atpAddress) ||
      selectedATP
    : null;

  // Initialize individual MATP hooks
  const updateOperatorHook = useUpdateStakerOperator(
    selectedATP?.atpAddress as Address,
  );
  const upgradeStakerHook = useUpgradeStaker(
    selectedATP?.atpAddress as Address,
  );
  const approveStakerHook = useApproveStaker(
    selectedATP?.atpAddress as Address,
  );

  // Initialize useStakeWithProvider hook with staker address from MATP
  const stakerHook = useStakeWithProvider(currentATPData?.staker as Address);

  // Get registry data and staker versions
  const { stakerVersions, isLoading: isLoadingVersions } = useAtpRegistryData();

  // Get staker implementations and corresponding versions
  const { implementations: stakerImplementations } =
    useStakerImplementations(stakerVersions);

  // Get rollup version
  const { version: rollupVersion, activationThreshold } = useRollupData();

  // Get allowance for the selected ATP
  const { allowance, refetch: refetchAllowance } = useAllowance({
    tokenAddress: currentATPData?.token as Address,
    owner: currentATPData?.atpAddress as Address,
    spender: currentATPData?.staker as Address,
  });

  // Get staker implementation address
  const {
    implementation: stakerImplementation,
    refetch: refetchImplementation,
  } = useStakerImplementation(currentATPData?.staker as Address);

  // Get provider configurations (including real take rate)
  const { providerTakeRate } = useProviderConfigurations(
    provider ? Number(provider.id) : 0
  );

  // ATP balance constants
  const [stakerVersion, setStakerVersion] = useState<bigint | null>(null);

  // Use the custom staking steps hook
  const {
    steps,
    currentStepIndex,
    updateStepStatus,
    setCurrentStep,
    resetSteps,
    resetStepsFrom,
  } = useStakingSteps(STEPS);

  // Use transaction manager for monitoring
  useTransactionManager([
    {
      hook: updateOperatorHook,
      id: "SET_OPERATOR_ADDRESS",
      onSuccess: () => {
        updateStepStatus("SET_OPERATOR_ADDRESS", "completed");
        setCurrentStep("SET_STAKER_VERSION");
        refetchMatpData();
      },
      onError: () => updateStepStatus("SET_OPERATOR_ADDRESS", "error"),
    },
    {
      hook: upgradeStakerHook,
      id: "SET_STAKER_VERSION",
      onSuccess: () => {
        updateStepStatus("SET_STAKER_VERSION", "completed");
        setCurrentStep("APPROVE_STAKER");
        refetchImplementation();
      },
      onError: () => updateStepStatus("SET_STAKER_VERSION", "error"),
    },
    {
      hook: approveStakerHook,
      id: "APPROVE_STAKER",
      onSuccess: () => {
        updateStepStatus("APPROVE_STAKER", "completed");
        setCurrentStep("STAKE");
        refetchAllowance();
      },
      onError: () => updateStepStatus("APPROVE_STAKER", "error"),
    },
    {
      hook: stakerHook,
      id: "STAKE",
      onSuccess: () => {
        updateStepStatus("STAKE", "completed");
        refetchAllowance();
      },
      onError: () => updateStepStatus("STAKE", "error"),
    },
  ]);

  const resetModalState = () => {
    setStakerVersion(null);
    setSelectedATP(null);
    resetSteps();
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Check if operator is already set when ATP is selected and update step status accordingly
  useEffect(() => {
    if (selectedATP) {
      // Check if operator is already set in the ATP data
      if (currentATPData?.operator && currentATPData.operator !== zeroAddress) {
        // Operator is already set, mark step 2 as completed
        updateStepStatus("SET_OPERATOR_ADDRESS", "completed");
      } else {
        // Operator not set, reset step 2 to pending
        updateStepStatus("SET_OPERATOR_ADDRESS", "pending");
      }
    }
  }, [selectedATP, currentATPData?.operator, updateStepStatus]);

  // Check if staker implementation is already set and mark step 3 as completed/incomplete
  useEffect(() => {
    const stakerVersionStepIndex = getStepIndex("SET_STAKER_VERSION", STEPS);

    if (
      stakerImplementation &&
      implementationSupportsStaking(stakerImplementation, stakerImplementations)
    ) {
      // Valid implementation that supports staking is set, mark step 3 as completed
      updateStepStatus("SET_STAKER_VERSION", "completed");
    } else {
      // Implementation is not set or doesn't support staking, mark step 3 as pending
      updateStepStatus("SET_STAKER_VERSION", "pending");

      // If we're currently past the SET_STAKER_VERSION step but implementation doesn't support staking,
      // go back to SET_STAKER_VERSION step to force user to select a valid version
      if (currentStepIndex > stakerVersionStepIndex) {
        setCurrentStep("SET_STAKER_VERSION");
      }
    }
  }, [
    stakerImplementation,
    stakerImplementations,
    currentStepIndex,
    updateStepStatus,
    setCurrentStep,
  ]);

  // Initialize staker version with latest version when versions are loaded
  useEffect(() => {
    if (stakerVersions.length > 0 && stakerVersion === null) {
      // Set to the latest version (highest number)
      const latestVersion = stakerVersions[stakerVersions.length - 1];
      setStakerVersion(latestVersion);
    }
  }, [stakerVersions, stakerVersion, isLoadingVersions]);

  // Reset subsequent steps when staker version changes (to force re-evaluation)
  useEffect(() => {
    if (stakerVersion !== null) {
      // Reset steps from APPROVE_STAKER onwards to pending when version changes
      resetStepsFrom("APPROVE_STAKER");
    }
  }, [stakerVersion, resetStepsFrom]);

  if (!isOpen || !provider) return null;

  const isTopProvider =
    parseFloat(provider.currentStake) >= topProviderStakeThreshold;

  const resetStepsAfterATP = () => {
    // Reset all steps except SELECT_ATP back to pending
    resetSteps("SELECT_ATP");
    updateStepStatus("SELECT_ATP", "completed");
    setCurrentStep("SET_OPERATOR_ADDRESS");
  };

  const handleSelectATP = async (atp: MATPData) => {
    const isChangingATP = selectedATP && selectedATP.type !== atp.type;

    setSelectedATP(atp);
    updateStepStatus("SELECT_ATP", "completed");

    if (isChangingATP) {
      resetStepsAfterATP();
    } else {
      setCurrentStep("SET_OPERATOR_ADDRESS");
    }
  };

  const handleSetOperator = async (operatorAddress: Address) => {
    if (!beneficiary || !selectedATP) {
      return;
    }
    updateStepStatus("SET_OPERATOR_ADDRESS", "in_progress");
    updateOperatorHook.updateStakerOperator(operatorAddress);
  };

  const handleUpgradeStaker = async () => {
    if (stakerVersion === null) {
      console.log("Cannot upgrade staker", { stakerVersion });
      return;
    }
    if (!selectedATP) {
      return;
    }

    updateStepStatus("SET_STAKER_VERSION", "in_progress");
    upgradeStakerHook.upgradeStaker(stakerVersion);
  };

  const handleApproveSpending = async () => {
    // Pre-flight checks
    if (!selectedATP || !selectedATP.allocation) {
      console.error("Cannot approve: no ATP selected or allocation missing");
      return;
    }

    if (
      currentATPData?.beneficiary &&
      beneficiary !== currentATPData.beneficiary
    ) {
      console.error(
        "Cannot approve: not the beneficiary of this ATP. Expected:",
        currentATPData.beneficiary,
        "Got:",
        beneficiary,
      );
      return;
    }

    if (!currentATPData?.staker || currentATPData.staker === zeroAddress) {
      console.error(
        "Cannot approve: staker not set yet. Need to complete step 3 first.",
      );
      return;
    }

    updateStepStatus("APPROVE_STAKER", "in_progress");
    approveStakerHook.approveStaker(selectedATP.allocation);
  };

  const handleStakeTokens = async () => {
    if (!beneficiary || rollupVersion === undefined) {
      console.log("Cannot stake with provider", { beneficiary, rollupVersion });
      return;
    }

    updateStepStatus("STAKE", "in_progress");
    stakerHook.stakeWithProvider(
      rollupVersion,
      BigInt(provider.id),
      providerTakeRate!,
      beneficiary,
      true,
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`${styles.modalContent} modal-content-base`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose}>
          ×
        </button>

        <div className={styles.modalBody}>
          {/* Left side - Operator Details */}
          <div className={styles.providerDetailsSection}>
            <div className={styles.sectionTitle}>
              {provider.logo_url && (
                <img
                  src={provider.logo_url}
                  alt={`${provider.name} logo`}
                  className={styles.providerLogoTitle}
                />
              )}
              <h2>{provider.name}</h2>
            </div>

            <div className={styles.providerInfoRows}>
              {provider.description && (
                <div className={`${styles.infoRow} ${styles.descriptionRow}`}>
                  <span className={styles.infoLabel}>Description</span>
                  <span className={styles.infoValueDescription}>
                    {provider.description}
                  </span>
                </div>
              )}

              {provider.website && (
                <div className={styles.websiteBadgeRow}>
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.websiteBadge}
                  >
                    <IconLink stroke={2} size={12} />

                    <span className={styles.websiteText}>Website</span>
                  </a>
                </div>
              )}

              <div className={styles.providerInfoGrid}>
                <div className={styles.infoCard}>
                  <h5 className={styles.infoLabel}>Current Stake</h5>
                  <p className={styles.infoValue}>
                    {formatNumber(parseFloat(provider.currentStake))} AZTEC
                  </p>
                </div>

                <div className={styles.infoCard}>
                  <h5 className={styles.infoLabel}>Commission</h5>
                  <p className={styles.infoValueCommission}>
                    <TakeRateDisplay providerId={provider.id} />
                  </p>
                </div>

                <div className={styles.infoCard}>
                  <h5 className={styles.infoLabel}>Delegators</h5>
                  <p className={styles.infoValue}>{provider.delegators || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Staking Steps */}
          <div className={styles.stakingStepsSection}>
            <h3 className={styles.delegateTitle}>
              Delegate stake to {provider.name} validator
            </h3>

            {isTopProvider && (
              <div className={styles.delegatePowerWarning}>
                You are delegating to one of the top 10 operators. To improve
                decentralization, please consider delegating to other operators.
              </div>
            )}

            {!isConnected ? (
              <div className={styles.connectWalletPrompt}>
                <p>Connect your wallet to start staking</p>
                <ConnectButton />
              </div>
            ) : (
              <div className={styles.stakingProcess}>
                {/* Steps List */}
                <div className={styles.stepsList}>
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`${styles.stepItem} ${styles[step.status]} ${currentStepIndex === step.id ? styles.current : ""}`}
                    >
                      <div className={styles.stepNumber}>
                        {getStepIcon(step.status, step.id)}
                      </div>
                      <div className={styles.stepMain}>
                        <div className={styles.stepHeader}>
                          <div className={styles.stepInfo}>
                            <h4>{step.title}</h4>
                          </div>
                        </div>

                        {step.stepId === "SELECT_ATP" && (
                          <StepSelectATP
                            selectedATP={selectedATP}
                            onSelectATP={handleSelectATP}
                            canExecute={
                              currentStepIndex >=
                              getStepIndex("SELECT_ATP", STEPS)
                            }
                            stepStatus={step.status}
                          />
                        )}

                        {step.stepId === "SET_OPERATOR_ADDRESS" && (
                          <StepSetOperator
                            beneficiary={beneficiary}
                            currentOperator={currentATPData?.operator}
                            isLoading={
                              step.status === "in_progress" ||
                              updateOperatorHook.isPending
                            }
                            error={updateOperatorHook.error?.message}
                            isCompleted={step.status === "completed"}
                            canExecute={
                              currentStepIndex >=
                                getStepIndex("SET_OPERATOR_ADDRESS", STEPS) &&
                              !!beneficiary &&
                              !!selectedATP
                            }
                            onSetOperator={handleSetOperator}
                          />
                        )}

                        {step.stepId === "SET_STAKER_VERSION" && (
                          <StepSetStakerVersion
                            implementations={stakerImplementations}
                            selectedVersion={stakerVersion}
                            currentImplementation={stakerImplementation}
                            isLoading={
                              step.status === "in_progress" ||
                              upgradeStakerHook.isPending
                            }
                            isLoadingVersions={isLoadingVersions}
                            error={upgradeStakerHook.error?.message}
                            isCompleted={step.status === "completed"}
                            canExecute={
                              currentStepIndex >=
                              getStepIndex("SET_STAKER_VERSION", STEPS)
                            }
                            onVersionChange={setStakerVersion}
                            onSetVersion={handleUpgradeStaker}
                          />
                        )}

                        {step.stepId === "APPROVE_STAKER" && (
                          <StepApprove
                            allocation={selectedATP?.allocation}
                            activationThreshold={activationThreshold}
                            currentAllowance={allowance}
                            isLoading={
                              step.status === "in_progress" ||
                              approveStakerHook.isPending
                            }
                            error={approveStakerHook.error?.message}
                            isCompleted={step.status === "completed"}
                            canExecute={
                              currentStepIndex >=
                              getStepIndex("APPROVE_STAKER", STEPS)
                            }
                            onApprove={handleApproveSpending}
                            onStepComplete={() =>
                              updateStepStatus("APPROVE_STAKER", "completed")
                            }
                          />
                        )}

                        {step.stepId === "STAKE" && (
                          <StepStake
                            allocation={selectedATP?.allocation}
                            activationThreshold={activationThreshold}
                            isLoading={
                              step.status === "in_progress" ||
                              stakerHook.isPending
                            }
                            error={stakerHook.error?.message}
                            canExecute={
                              currentStepIndex >=
                                getStepIndex("STAKE", STEPS) &&
                              !!currentATPData?.staker
                            }
                            isSuccess={stakerHook.isSuccess}
                            onStake={handleStakeTokens}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
