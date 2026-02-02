import { useState, useCallback, useEffect } from "react";
import {
  STAKING_STEPS,
  type StepId,
  type StepStatus,
  getStepIndex,
} from "../utils/stakingSteps";

export interface StakingStep {
  id: number;
  stepId: StepId;
  title: string;
  status: StepStatus;
}

export interface UseStakingStepsOptions {
  onStepAdvance?: (stepId: StepId, stepIndex: number) => void;
  autoAdvance?: boolean;
}

export interface UseStakingStepsReturn {
  steps: StakingStep[];
  currentStepIndex: number;
  updateStepStatus: (stepId: StepId, status: StepStatus) => void;
  setCurrentStep: (stepId: StepId) => void;
  resetSteps: (exceptStepId?: StepId) => void;
  resetStepsFrom: (fromStepId: StepId) => void;
  getNextStep: (currentStepId: StepId) => StepId | undefined;
  getPreviousStep: (currentStepId: StepId) => StepId | undefined;
}

export function useStakingSteps(
  stepIds: StepId[],
  options: UseStakingStepsOptions = {},
): UseStakingStepsReturn {
  const { autoAdvance = true } = options;

  const [steps, setSteps] = useState<StakingStep[]>(() =>
    stepIds.map((stepId, index) => ({
      id: index + 1,
      stepId,
      title: STAKING_STEPS[stepId].title,
      status: "pending" as StepStatus,
    })),
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(1);

  // Set current step by stepId
  const setCurrentStep = useCallback(
    (stepId: StepId) => {
      const stepIndex = getStepIndex(stepId, stepIds);
      setCurrentStepIndex(stepIndex);
    },
    [stepIds],
  );

  // Update step status by StepId
  const updateStepStatus = useCallback(
    (stepId: StepId, status: StepStatus) => {
      const stepIndex = getStepIndex(stepId, stepIds);
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepIndex ? { ...step, status } : step,
        ),
      );
    },
    [stepIds],
  );

  // Reset all steps to pending (except optionally one step)
  const resetSteps = useCallback(
    (exceptStepId?: StepId) => {
      const exceptIndex = exceptStepId
        ? getStepIndex(exceptStepId, stepIds)
        : -1;
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: step.id === exceptIndex ? step.status : "pending",
        })),
      );
      if (!exceptStepId) {
        setCurrentStepIndex(1);
      }
    },
    [stepIds],
  );

  // Reset steps from a specific step onwards
  const resetStepsFrom = useCallback(
    (fromStepId: StepId) => {
      const fromIndex = getStepIndex(fromStepId, stepIds);
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: step.id >= fromIndex ? "pending" : step.status,
        })),
      );
    },
    [stepIds],
  );

  // Get next step ID
  const getNextStep = useCallback(
    (currentStepId: StepId): StepId | undefined => {
      const currentIndex = getStepIndex(currentStepId, stepIds);
      if (currentIndex < stepIds.length) {
        return stepIds[currentIndex]; // currentIndex is 1-based, array is 0-based
      }
      return undefined;
    },
    [stepIds],
  );

  // Get previous step ID
  const getPreviousStep = useCallback(
    (currentStepId: StepId): StepId | undefined => {
      const currentIndex = getStepIndex(currentStepId, stepIds);
      if (currentIndex > 1) {
        return stepIds[currentIndex - 2]; // currentIndex is 1-based, array is 0-based
      }
      return undefined;
    },
    [stepIds],
  );

  // Auto-advance current step based on completed steps (sequential completion required)
  useEffect(() => {
    if (!autoAdvance) return;

    // Find the highest sequential completed step
    let nextAvailableStep = 1;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].status === "completed") {
        nextAvailableStep = steps[i].id + 1;
      } else {
        // Stop at the first non-completed step
        break;
      }
    }

    // Only advance if we're currently behind the sequential completion
    setCurrentStepIndex((prevStep) => {
      if (nextAvailableStep > prevStep && nextAvailableStep <= stepIds.length) {
        // Call optional callback when advancing
        if (options.onStepAdvance && nextAvailableStep <= stepIds.length) {
          const stepId = stepIds[nextAvailableStep - 1];
          options.onStepAdvance(stepId, nextAvailableStep);
        }
        return nextAvailableStep;
      }
      return prevStep;
    });
  }, [steps, stepIds.length, autoAdvance, options]);

  return {
    steps,
    currentStepIndex,
    updateStepStatus,
    setCurrentStep,
    resetSteps,
    resetStepsFrom,
    getNextStep,
    getPreviousStep,
  };
}
