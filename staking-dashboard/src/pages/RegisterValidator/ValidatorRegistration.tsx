import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { RegistrationPreInfo } from "../../components/Registration/RegistrationPreInfo";
import {
  VALIDATOR_REGISTRATION_STEP_IDS as STEPS,
  getStepIndex,
  getStepIcon,
} from "../../utils/stakingSteps";
import { validateValidatorKeys } from "../../types/keystore";
import { useStakingSteps } from "../../hooks/useStakingSteps";
import { useTransactionManager } from "../../hooks/useTransactionManager";
import styles from "./ValidatorRegistration.module.css";
import StepSelectATP from "../../components/StepSelectATP/StepSelectATP";
import StepSetOperator from "../../components/StepSetOperator/StepSetOperator";
import StepSetStakerVersion from "../../components/StepSetStakerVersion/StepSetStakerVersion";
import StepApprove from "../../components/StepApprove/StepApprove";
import StepStake from "../../components/StepStake/StepStake";
import StepSetValidatorAddress from "../../components/StepSetValidatorAddress/StepSetValidatorAddress";
import StepUploadKeys from "../../components/StepUploadKeys/StepUploadKeys";
import { useATP } from "../../hooks/useATP";
import type { MATPData } from "../../hooks/atp/matp";
import { useUpdateStakerOperator } from "../../hooks/atp/useUpdateStakerOperator";
import { useUpgradeStaker } from "../../hooks/atp/useUpgradeStaker";
import { useApproveStaker } from "../../hooks/atp/useApproveStaker";
import {
  useAtpRegistryData,
  useStakerImplementations,
} from "../../hooks/atpRegistry";
import { useStake } from "../../hooks/staker/useStake";
import { useStakerImplementation } from "../../hooks/staker/useStakerImplementation";
import { useAllowance } from "../../hooks/erc20/useAllowance";
import { useRollupData } from "../../hooks/rollup";
import { implementationSupportsStaking } from "../../utils/stakerVersion";
import type { Address } from "viem";
import { zeroAddress, isAddress } from "viem";

// Interface moved to useStakingSteps hook

export default function ValidatorRegistration() {
  const { isConnected, address: beneficiary } = useAccount();
  const { atpData: matpData, refetchAtpData: refetchMatpData } = useATP();

  // Pre-registration state
  const [showPreInfo, setShowPreInfo] = useState(true);

  // Validator registration state
  const [selectedATP, setSelectedATP] = useState<MATPData | null>(null);
  const [validatorAddress, setValidatorAddress] = useState("");
  const [isValidatorRunning, setIsValidatorRunning] = useState(false);
  const [operatorAddress, setOperatorAddress] = useState(beneficiary || "");
  const [stakerVersion, setStakerVersion] = useState<bigint | null>(null);

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

  // Initialize useStake hook with staker address from MATP
  const stakeHook = useStake(selectedATP?.staker as Address);

  // Get registry data and staker versions
  const { stakerVersions, isLoading: isLoadingAtpRegistryData } =
    useAtpRegistryData();

  // Get mapping version: implementation
  const { implementations: stakerImplementations } =
    useStakerImplementations(stakerVersions);

  // Get rollup data including activation threshold and version
  const { activationThreshold, version: rollupVersion } = useRollupData();

  const [attester, setAttester] = useState("");
  const [publicKeyG1, setPublicKeyG1] = useState({ x: "0", y: "0" });
  const [publicKeyG2, setPublicKeyG2] = useState({
    x: ["0", "0"] as [string, string],
    y: ["0", "0"] as [string, string],
  });
  const [signature, setSignature] = useState({ x: "0", y: "0" });
  const [moveWithLatestRollup, setMoveWithLatestRollup] = useState(true);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  // Get the current ATP data from matpData to ensure we have fresh data after refetch
  const currentATPData = selectedATP
    ? matpData.find((atp) => atp.atpAddress === selectedATP.atpAddress) ||
      selectedATP
    : null;

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

  // Use the custom staking steps hook
  const { steps, currentStepIndex, updateStepStatus, setCurrentStep } =
    useStakingSteps(STEPS);

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
        setCurrentStep("UPLOAD_VALIDATOR_KEYS");
        refetchAllowance();
      },
      onError: () => updateStepStatus("APPROVE_STAKER", "error"),
    },
    {
      hook: stakeHook,
      id: "STAKE",
      onSuccess: () => {
        updateStepStatus("STAKE", "completed");
        setRegistrationCompleted(true);
      },
      onError: () => updateStepStatus("STAKE", "error"),
    },
  ]);

  const handleStartRegistration = () => {
    setShowPreInfo(false);
  };

  // Update operator address when beneficiary changes
  useEffect(() => {
    if (beneficiary && !operatorAddress) {
      setOperatorAddress(beneficiary);
    }
  }, [beneficiary]);

  const handleSelectATP = async (atp: MATPData) => {
    setSelectedATP(atp);
    updateStepStatus("SELECT_ATP", "completed");
    setCurrentStep("SET_VALIDATOR_ADDRESS");
  };

  const handleSetOperator = async (operatorAddress: Address) => {
    if (!beneficiary || !selectedATP) {
      return;
    }
    updateStepStatus("SET_OPERATOR_ADDRESS", "in_progress");
    updateOperatorHook.updateStakerOperator(operatorAddress);
  };

  const handleUpgradeStaker = async () => {
    if (stakerVersion === null || !selectedATP) {
      console.log("Cannot upgrade staker", { stakerVersion });
      return;
    }

    updateStepStatus("SET_STAKER_VERSION", "in_progress");
    upgradeStakerHook.upgradeStaker(stakerVersion);
  };

  const handleApproveStaker = async () => {
    if (!selectedATP?.allocation) {
      console.log("Cannot approve staker", {
        allocation: selectedATP?.allocation,
      });
      return;
    }

    updateStepStatus("APPROVE_STAKER", "in_progress");
    approveStakerHook.approveStaker(selectedATP.allocation);
  };

  const handleStakeTokens = async () => {
    if (
      rollupVersion === undefined ||
      !attester ||
      !isAddress(attester) ||
      !beneficiary ||
      !areKeysValid()
    ) {
      console.log("Cannot stake", { rollupVersion, attester });
      return;
    }

    updateStepStatus("STAKE", "in_progress");
    stakeHook.stake(
      rollupVersion,
      attester as Address,
      publicKeyG1,
      publicKeyG2,
      signature,
      moveWithLatestRollup,
    );
  };

  const areKeysValid = () => {
    return validateValidatorKeys({
      attester,
      publicKeyG1,
      publicKeyG2,
      proofOfPossession: signature,
    });
  };

  // Initialize staker version with latest version when versions are loaded
  useEffect(() => {
    if (stakerVersions.length > 0 && stakerVersion === null) {
      // Set to the latest version (highest number)
      const latestVersion = stakerVersions[stakerVersions.length - 1];
      setStakerVersion(latestVersion);
    }
  }, [stakerVersions, stakerVersion, isLoadingAtpRegistryData]);

  // Check if staker implementation is already set and mark step 4 as completed/incomplete
  useEffect(() => {
    const stakerVersionStepIndex = getStepIndex("SET_STAKER_VERSION", STEPS);

    if (
      stakerImplementation &&
      implementationSupportsStaking(stakerImplementation, stakerImplementations)
    ) {
      // Valid implementation that supports staking is set, mark step 4 as completed
      updateStepStatus("SET_STAKER_VERSION", "completed");
    } else {
      // Implementation is not set or doesn't support staking, mark step 4 as pending
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

  // Check if operator is already set when ATP is selected
  useEffect(() => {
    if (selectedATP) {
      if (selectedATP?.operator && selectedATP.operator !== zeroAddress) {
        updateStepStatus("SET_OPERATOR_ADDRESS", "completed");
      } else {
        updateStepStatus("SET_OPERATOR_ADDRESS", "pending");
      }
    }
  }, [selectedATP, selectedATP?.operator, updateStepStatus]);

  // Auto-complete step 2 when conditions are met
  useEffect(() => {
    if (currentStepIndex >= getStepIndex("SET_VALIDATOR_ADDRESS", STEPS)) {
      const canCompleteStep2 =
        validatorAddress && isAddress(validatorAddress) && isValidatorRunning;

      if (canCompleteStep2 && steps[1].status !== "completed") {
        updateStepStatus("SET_VALIDATOR_ADDRESS", "completed");
        setCurrentStep("SET_OPERATOR_ADDRESS");
      } else if (!canCompleteStep2 && steps[1].status === "completed") {
        // Reset to pending if user modified completed step and conditions no longer met
        updateStepStatus("SET_VALIDATOR_ADDRESS", "pending");
        // If we're past step 2, go back to step 2
        if (currentStepIndex > getStepIndex("SET_VALIDATOR_ADDRESS", STEPS)) {
          setCurrentStep("SET_VALIDATOR_ADDRESS");
        }
      }
    }
  }, [
    validatorAddress,
    isValidatorRunning,
    currentStepIndex,
    steps,
    updateStepStatus,
  ]);

  // Auto-complete step 6 when all keys are valid
  useEffect(() => {
    if (currentStepIndex >= getStepIndex("UPLOAD_VALIDATOR_KEYS", STEPS)) {
      const keysValid = areKeysValid();
      const stepIndex = getStepIndex("UPLOAD_VALIDATOR_KEYS", STEPS) - 1;
      const currentStatus = steps[stepIndex]?.status;

      if (keysValid && currentStatus !== "completed") {
        updateStepStatus("UPLOAD_VALIDATOR_KEYS", "completed");
        setCurrentStep("STAKE");
      } else if (!keysValid && currentStatus === "completed") {
        // Reset to pending if keys are no longer valid
        updateStepStatus("UPLOAD_VALIDATOR_KEYS", "pending");
        // If we're past this step, go back to this step
        if (currentStepIndex > getStepIndex("UPLOAD_VALIDATOR_KEYS", STEPS)) {
          setCurrentStep("UPLOAD_VALIDATOR_KEYS");
        }
      }
    }
  }, [
    currentStepIndex,
    attester,
    publicKeyG1,
    publicKeyG2,
    signature,
    steps,
    updateStepStatus,
    setCurrentStep,
  ]);

  return (
    <div className={`page-content ${styles.registerView}`}>
      <div className={`page-header ${styles.sectionHeader}`}>
        <div>
          <h2>Register your Validator</h2>
          <p>
            Follow these steps to register and stake with your validator node
          </p>
        </div>
      </div>

      {showPreInfo ? (
        <RegistrationPreInfo onStartRegistration={handleStartRegistration} />
      ) : !isConnected ? (
        <div className={styles.connectWalletPrompt}>
          <p>Connect your wallet to register as a validator</p>
          <ConnectButton />
        </div>
      ) : (
        <div className={styles.registrationProcess}>
          {/* Steps List */}
          <div className={styles.stepsList}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`${styles.stepItem} ${styles[step.status]} ${currentStepIndex === step.id ? styles.current : ""}`}
              >
                <div className={styles.stepNumber}>
                  {getStepIcon(step.status, index + 1)}
                </div>
                <div className={styles.stepMain}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepInfo}>
                      <h4>{step.title}</h4>
                    </div>
                  </div>

                  {step.stepId === "UPLOAD_VALIDATOR_KEYS" && (
                    <StepUploadKeys
                      attester={attester}
                      publicKeyG1={publicKeyG1}
                      publicKeyG2={publicKeyG2}
                      signature={signature}
                      moveWithLatestRollup={moveWithLatestRollup}
                      canExecute={
                        currentStepIndex >=
                        getStepIndex("UPLOAD_VALIDATOR_KEYS", STEPS)
                      }
                      onAttesterChange={setAttester}
                      onPublicKeyG1Change={setPublicKeyG1}
                      onPublicKeyG2Change={setPublicKeyG2}
                      onSignatureChange={setSignature}
                      onMoveWithLatestRollupChange={setMoveWithLatestRollup}
                    />
                  )}

                  {step.stepId === "STAKE" && (
                    <StepStake
                      allocation={selectedATP?.allocation}
                      activationThreshold={activationThreshold}
                      isLoading={
                        step.status === "in_progress" || stakeHook.isPending
                      }
                      error={stakeHook.error?.message}
                      canExecute={true}
                      onStake={handleStakeTokens}
                    />
                  )}

                  {step.stepId === "SELECT_ATP" && (
                    <StepSelectATP
                      selectedATP={selectedATP}
                      onSelectATP={handleSelectATP}
                      canExecute={
                        currentStepIndex >= getStepIndex("SELECT_ATP", STEPS)
                      }
                      stepStatus={step.status}
                    />
                  )}

                  {step.stepId === "SET_VALIDATOR_ADDRESS" && (
                    <StepSetValidatorAddress
                      validatorAddress={validatorAddress}
                      isValidatorRunning={isValidatorRunning}
                      canExecute={
                        currentStepIndex >=
                        getStepIndex("SET_VALIDATOR_ADDRESS", STEPS)
                      }
                      onValidatorAddressChange={setValidatorAddress}
                      onValidatorRunningChange={setIsValidatorRunning}
                    />
                  )}

                  {step.stepId === "SET_OPERATOR_ADDRESS" && (
                    <StepSetOperator
                      beneficiary={beneficiary}
                      currentOperator={selectedATP?.operator}
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
                      isLoadingVersions={isLoadingAtpRegistryData}
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
                      onApprove={handleApproveStaker}
                      onStepComplete={() =>
                        updateStepStatus("APPROVE_STAKER", "completed")
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Success Message */}
          {registrationCompleted && (
            <div className={styles.successMessageCompact}>
              <span className={styles.successIcon}>✓</span>
              <span>Successfully registered validator and staked</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
