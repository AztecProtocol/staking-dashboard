export type StepStatus = "pending" | "in_progress" | "completed" | "error";

// All possible staking steps
export const STAKING_STEPS = {
  SELECT_ATP: {
    title: "Select Token Position to stake",
  },
  SET_VALIDATOR_ADDRESS: {
    title: "Input your Validator Address and confirm it's up and synced",
  },
  SET_OPERATOR_ADDRESS: {
    title: "Set Operator Address",
  },
  SET_STAKER_VERSION: {
    title: "Set version of Staker contract",
  },
  APPROVE_STAKER: {
    title: "Approve token spending",
  },
  UPLOAD_VALIDATOR_KEYS: {
    title: "Upload Validator Keys",
  },
  STAKE: {
    title: "Stake",
  },
} as const;

export type StepId = keyof typeof STAKING_STEPS;

// Step configurations for different flows
export const DELEGATION_STEP_IDS: StepId[] = [
  "SELECT_ATP",
  "SET_OPERATOR_ADDRESS",
  "SET_STAKER_VERSION",
  "APPROVE_STAKER",
  "STAKE",
];

export const VALIDATOR_REGISTRATION_STEP_IDS: StepId[] = [
  "SELECT_ATP",
  "SET_VALIDATOR_ADDRESS",
  "SET_OPERATOR_ADDRESS",
  "SET_STAKER_VERSION",
  "APPROVE_STAKER",
  "UPLOAD_VALIDATOR_KEYS",
  "STAKE",
];

// Helper functions for step index management
export const getStepIndex = (stepId: StepId, steps: StepId[]): number => {
  return steps.indexOf(stepId) + 1; // +1 for 1-based indexing
};

export const getStepIdByIndex = (
  index: number,
  steps: StepId[],
): StepId | undefined => {
  return steps[index - 1]; // -1 for 0-based array access
};

export const getStepsBeyondIndex = (
  fromStepId: StepId,
  steps: StepId[],
): number => {
  return getStepIndex(fromStepId, steps);
};

export const getStepIcon = (status: StepStatus, stepNumber: number) => {
  switch (status) {
    case "completed":
      return "✓";
    case "in_progress":
      return "⟳";
    case "error":
      return "✗";
    default:
      return stepNumber.toString();
  }
};
