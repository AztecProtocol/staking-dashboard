import { useReadContract } from "wagmi";
import { contracts } from "@/contracts";

export interface ProposeWithLockConfiguration {
  lockDelay: bigint;
  lockAmount: bigint;
}

export interface GovernanceConfiguration {
  proposeConfig: ProposeWithLockConfiguration;
  votingDelay: bigint;
  votingDuration: bigint;
  executionDelay: bigint;
  gracePeriod: bigint;
  quorum: bigint;
  requiredYeaMargin: bigint;
  minimumVotes: bigint;
}

// Default withdrawal delay in days
// Based on typical values: max(4 days rollup exit, ~14.6 days governance) ≈ 14.6 days
const DEFAULT_WITHDRAWAL_DELAY_DAYS = 14.6;

/**
 * Hook to get the effective withdrawal delay for unstaking.
 *
 * DEV NOTE: The true exit delay is the MAX of two delays:
 * 1. Rollup exit delay: rollup.getExitDelay() - the minimum time to wait after initiating unstake
 * 2. Governance delay: votingDelay/5 + votingDuration + executionDelay - ensures governance
 *    can slash a validator before they can withdraw if a slashing proposal is in progress
 *
 * The governance delay prevents a validator from front-running a slashing proposal by
 * withdrawing before the proposal can be executed.
 */
export function useGovernanceConfig() {
  // Fetch governance configuration
  const governanceQuery = useReadContract({
    abi: contracts.governance.abi,
    address: contracts.governance.address,
    functionName: "getConfiguration",
    query: {
      retry: false,
    },
  });

  // Fetch rollup exit delay
  const rollupExitDelayQuery = useReadContract({
    abi: contracts.rollup.abi,
    address: contracts.rollup.address,
    functionName: "getExitDelay",
    query: {
      retry: false,
    },
  });

  const config = governanceQuery.data as GovernanceConfiguration | undefined;
  const rollupExitDelay = rollupExitDelayQuery.data as bigint | undefined;

  // Calculate governance delay in seconds: votingDelay/5 + votingDuration + executionDelay
  const governanceDelay = config
    ? config.votingDelay / 5n + config.votingDuration + config.executionDelay
    : undefined;

  // True withdrawal delay is the MAX of rollup exit delay and governance delay
  let withdrawalDelay: bigint | undefined;
  if (governanceDelay !== undefined && rollupExitDelay !== undefined) {
    withdrawalDelay = governanceDelay > rollupExitDelay ? governanceDelay : rollupExitDelay;
  } else if (governanceDelay !== undefined) {
    withdrawalDelay = governanceDelay;
  } else if (rollupExitDelay !== undefined) {
    withdrawalDelay = rollupExitDelay;
  }

  // Convert withdrawal delay to days for display
  // Fall back to default if contract data is unavailable
  const withdrawalDelayDays = withdrawalDelay
    ? Number(withdrawalDelay) / (24 * 60 * 60)
    : DEFAULT_WITHDRAWAL_DELAY_DAYS;

  return {
    config,
    rollupExitDelay,
    governanceDelay,
    withdrawalDelay,
    withdrawalDelayDays,
    isLoading: governanceQuery.isLoading || rollupExitDelayQuery.isLoading,
    error: governanceQuery.error || rollupExitDelayQuery.error,
    refetch: () => {
      governanceQuery.refetch();
      rollupExitDelayQuery.refetch();
    },
  };
}
