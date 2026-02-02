import type { Address } from "viem";

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Queued = 2,
  Executable = 3,
  Rejected = 4,
  Executed = 5,
  Droppable = 6,
  Dropped = 7,
  Expired = 8,
}

export interface ProposalConfiguration {
  votingDelay: bigint;
  votingDuration: bigint;
  executionDelay: bigint;
  gracePeriod: bigint;
  quorum: bigint; // 1e18 scaled percentage
  voteDifferential: bigint; // 1e18 scaled percentage (yea margin)
  minimumVotes: bigint; // Minimum total voting power required
}

export interface Ballot {
  yea: bigint;
  nay: bigint;
}

export interface ProposalRaw {
  configuration: ProposalConfiguration;
  state: number;
  payload: Address;
  creator: Address;
  creation: bigint;
  summedBallot: Ballot;
}

export interface Proposal {
  id: bigint;
  state: ProposalState;
  config: ProposalConfiguration;
  payloadAddress: Address;
  proposerAddress: Address;
  creationTimestamp: bigint;
  ballot: Ballot;
  uri?: string;
}

export interface UserBallot {
  proposalId: bigint;
  yea: bigint;
  nay: bigint;
}

// Voting power for a single staker (ATP)
export interface StakerVotingPower {
  stakerAddress: Address;
  atpAddress: Address;
  atpType: string; // 'MATP' | 'LATP' | 'NCATP'
  sequentialNumber: number;
  power: bigint;
}

export interface UserVotingPower {
  // Power from direct deposit (for ERC20 holders)
  directPower: bigint;
  // Power from each Staker contract (for ATP holders)
  stakerPowers: StakerVotingPower[];
  // Total combined power
  totalPower: bigint;
}

// Map of voter address to their ballot
export type BallotsBySource = Map<string, Ballot>; // key is "direct" or staker address

// Helper functions for proposal calculations
export function getTotalVotes(ballot: Ballot): bigint {
  return ballot.yea + ballot.nay;
}

export function getYeaPercentage(ballot: Ballot): number {
  const total = getTotalVotes(ballot);
  if (total === 0n) return 0;
  return Number((ballot.yea * 10000n) / total) / 100;
}

export function getNayPercentage(ballot: Ballot): number {
  const total = getTotalVotes(ballot);
  if (total === 0n) return 0;
  return Number((ballot.nay * 10000n) / total) / 100;
}

// Timeline calculation helpers
export function getPendingThrough(creation: bigint, config: ProposalConfiguration): bigint {
  return creation + config.votingDelay;
}

export function getActiveThrough(creation: bigint, config: ProposalConfiguration): bigint {
  return getPendingThrough(creation, config) + config.votingDuration;
}

export function getQueuedThrough(creation: bigint, config: ProposalConfiguration): bigint {
  return getActiveThrough(creation, config) + config.executionDelay;
}

export function getExecutableThrough(creation: bigint, config: ProposalConfiguration): bigint {
  return getQueuedThrough(creation, config) + config.gracePeriod;
}

// State label helpers
export function getStateLabel(state: ProposalState): string {
  switch (state) {
    case ProposalState.Pending:
      return "Pending";
    case ProposalState.Active:
      return "Voting Live";
    case ProposalState.Queued:
      return "Queued";
    case ProposalState.Executable:
      return "Executable";
    case ProposalState.Rejected:
      return "Rejected";
    case ProposalState.Executed:
      return "Executed";
    case ProposalState.Droppable:
      return "Droppable";
    case ProposalState.Dropped:
      return "Dropped";
    case ProposalState.Expired:
      return "Expired";
    default:
      return "Unknown";
  }
}

export function isTerminalState(state: ProposalState): boolean {
  return [
    ProposalState.Rejected,
    ProposalState.Executed,
    ProposalState.Dropped,
    ProposalState.Expired,
  ].includes(state);
}

export function isVotingOpen(state: ProposalState): boolean {
  return state === ProposalState.Active;
}

// Quorum calculation: quorum is stored as 1e18 scaled percentage (e.g., 0.2e18 = 20%)
export function getQuorumPercentage(quorum: bigint): number {
  return Number(quorum) / 1e18 * 100;
}

// Vote differential (yea margin): stored as 1e18 scaled (e.g., 0.33e18 = 33%)
export function getYeaMarginPercentage(voteDifferential: bigint): number {
  return Number(voteDifferential) / 1e18 * 100;
}

// Rejection reasons matching the contract's VoteTabulationInfo
export enum RejectionReason {
  None = "none",
  TotalPowerBelowMinimum = "total_power_below_minimum",
  QuorumNotMet = "quorum_not_met",
  InsufficientYeaVotes = "insufficient_yea_votes",
}

// Calculate the required yea votes based on the contract logic
// From ProposalLib: requiredApprovalVotes = ceil(votesCast * ceil((1e18 + requiredYeaMargin) / 2) / 1e18)
export function getRequiredYeaVotes(votesCast: bigint, yeaMargin: bigint): bigint {
  if (votesCast === 0n) return 0n;
  const scale = 10n ** 18n;
  // ceil((1e18 + yeaMargin) / 2)
  const threshold = (scale + yeaMargin + 1n) / 2n;
  // ceil(votesCast * threshold / 1e18)
  return (votesCast * threshold + scale - 1n) / scale;
}

// Determine why a proposal was rejected (or would be rejected)
export function getRejectionReason(
  ballot: Ballot,
  config: ProposalConfiguration,
  totalPower: bigint
): RejectionReason {
  const totalVotes = getTotalVotes(ballot);

  // Check 1: Total power must be >= minimumVotes
  if (totalPower < config.minimumVotes) {
    return RejectionReason.TotalPowerBelowMinimum;
  }

  // Check 2: Quorum - votes cast must be >= (totalPower * quorum / 1e18)
  const scale = 10n ** 18n;
  const quorumRequired = (totalPower * config.quorum + scale - 1n) / scale; // ceil
  if (totalVotes < quorumRequired) {
    return RejectionReason.QuorumNotMet;
  }

  // Check 3: Yea votes must strictly exceed required approval threshold
  const requiredYea = getRequiredYeaVotes(totalVotes, config.voteDifferential);
  if (ballot.yea <= requiredYea) {
    return RejectionReason.InsufficientYeaVotes;
  }

  return RejectionReason.None;
}

// Get a human-readable message for the rejection reason
export function getRejectionMessage(reason: RejectionReason): string {
  switch (reason) {
    case RejectionReason.TotalPowerBelowMinimum:
      return "Total voting power below minimum threshold";
    case RejectionReason.QuorumNotMet:
      return "Quorum not met - insufficient voter participation";
    case RejectionReason.InsufficientYeaVotes:
      return "Insufficient yes votes to pass";
    case RejectionReason.None:
    default:
      return "";
  }
}
