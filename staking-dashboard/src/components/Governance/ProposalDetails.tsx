import { useEffect, useRef } from "react";
import { formatUnits, keccak256, toBytes, pad, toHex, type Address } from "viem";
import { useBlock } from "wagmi";
import type { Proposal, UserVotingPower, BallotsBySource } from "@/hooks/governance";
import { formatDateTime } from "@/utils/dateFormatters";
import { getExplorerAddressUrl, getExplorerBaseUrl } from "@/utils/explorerUtils";
import {
  getPendingThrough,
  getActiveThrough,
  getQueuedThrough,
  getExecutableThrough,
  getQuorumPercentage,
  getYeaMarginPercentage,
  getTotalVotes,
  getRejectionReason,
  getRequiredYeaVotes,
  isTerminalState,
  ProposalState,
  RejectionReason,
  useExecuteProposal,
} from "@/hooks/governance";
import { VoteBar } from "./VoteBar";
import { VotingPanel } from "./VotingPanel";
import { ProposalTimeline } from "./ProposalTimeline";
import { TooltipIcon } from "@/components/Tooltip";
import { useAlert } from "@/contexts/AlertContext";
import { contracts } from "@/contracts";

type TimelinePhase = "Pending" | "Voting Live" | "Queued" | "Executable" | "Expired";

function getTimelinePhase(
  now: bigint,
  creationTimestamp: bigint,
  pendingThrough: bigint,
  activeThrough: bigint,
  queuedThrough: bigint,
  executableThrough: bigint
): TimelinePhase {
  if (now < creationTimestamp) return "Pending";
  if (now < pendingThrough) return "Pending";
  if (now < activeThrough) return "Voting Live";
  if (now < queuedThrough) return "Queued";
  if (now < executableThrough) return "Executable";
  return "Expired";
}

const PHASE_STYLES: Record<TimelinePhase, string> = {
  Pending: "bg-parchment/20 text-parchment/70",
  "Voting Live": "bg-chartreuse/20 text-chartreuse",
  Queued: "bg-orchid/20 text-orchid",
  Executable: "bg-aqua/20 text-aqua",
  Expired: "bg-parchment/20 text-parchment/70",
};

type VotingResult = "Passed" | "Executed" | "Rejected" | null;

function getVotingResult(state: ProposalState): VotingResult {
  // Executed: proposal has been executed
  if (state === ProposalState.Executed) {
    return "Executed";
  }
  // Passed: passed voting and is queued or executable
  if ([ProposalState.Queued, ProposalState.Executable].includes(state)) {
    return "Passed";
  }
  // Rejected: failed voting or expired/dropped
  if ([ProposalState.Rejected, ProposalState.Dropped, ProposalState.Expired].includes(state)) {
    return "Rejected";
  }
  return null;
}

const RESULT_STYLES: Record<Exclude<VotingResult, null>, string> = {
  Passed: "bg-chartreuse/20 text-chartreuse border border-chartreuse/50",
  Executed: "bg-aqua/20 text-aqua border border-aqua/50",
  Rejected: "bg-orchid/20 text-orchid border border-orchid/50",
};

function VotingResultBadge({ state }: { state: ProposalState }) {
  const result = getVotingResult(state);
  if (!result) return null;
  return (
    <span className={`px-2 py-0.5 text-xs ${RESULT_STYLES[result]}`}>
      {result}
    </span>
  );
}

interface DelegatedVotingPowerResult {
  totalPower: bigint;
  currentPower: bigint;
  isLoading: boolean;
  error: Error | null;
}

interface ProposalDetailsProps {
  proposal: Proposal;
  votingPower: UserVotingPower;
  ballots: BallotsBySource;
  snapshotPower?: bigint;
  directSnapshotPower?: bigint;
  currentTotalPower?: bigint;
  delegatedVotingPower?: DelegatedVotingPowerResult;
  onVoteSuccess: () => void;
}

function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProposalDetails({
  proposal,
  votingPower,
  ballots,
  snapshotPower,
  directSnapshotPower,
  currentTotalPower,
  delegatedVotingPower,
  onVoteSuccess,
}: ProposalDetailsProps) {
  const { config, ballot, creationTimestamp } = proposal;

  const pendingThrough = getPendingThrough(creationTimestamp, config);
  const activeThrough = getActiveThrough(creationTimestamp, config);
  const queuedThrough = getQueuedThrough(creationTimestamp, config);
  const executableThrough = getExecutableThrough(creationTimestamp, config);

  // Get current blockchain time for phase calculation
  const { data: block } = useBlock({ watch: true });
  const now = block?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));
  const currentPhase = getTimelinePhase(
    now,
    creationTimestamp,
    pendingThrough,
    activeThrough,
    queuedThrough,
    executableThrough
  );

  const totalVotes = getTotalVotes(ballot);
  const quorumPct = getQuorumPercentage(config.quorum);
  const yeaMarginPct = getYeaMarginPercentage(config.voteDifferential);

  // Calculate if requirements are met
  const effectivePower = snapshotPower ?? 0n;
  const scale = 10n ** 18n;
  const quorumRequired = effectivePower > 0n
    ? (effectivePower * config.quorum + scale - 1n) / scale // ceil
    : 0n;
  const quorumMet = quorumRequired > 0n && totalVotes >= quorumRequired;

  // Calculate participation percentage (% of total voting power that participated)
  const participationPct = effectivePower > 0n
    ? Number((totalVotes * 10000n) / effectivePower) / 100
    : 0;

  // Calculate yea vote requirements
  const requiredYeaVotes = getRequiredYeaVotes(totalVotes, config.voteDifferential);
  const yeaMet = ballot.yea > requiredYeaVotes;
  const yeaPercentage = totalVotes > 0n
    ? Number((ballot.yea * 10000n) / totalVotes) / 100
    : 0;
  const requiredYeaPercentage = 50 + yeaMarginPct / 2;

  // Check minimum votes requirement
  const minVotesMet = effectivePower >= config.minimumVotes;

  // Calculate rejection reason (for rejected proposals or preview)
  const rejectionReason = getRejectionReason(ballot, config, effectivePower);

  // Check if voting is over (terminal state)
  const votingOver = isTerminalState(proposal.state);

  // Execute proposal hook
  const executeProposal = useExecuteProposal();
  const { showAlert } = useAlert();

  // Track previous execute states to detect transitions
  const prevExecuteRef = useRef({ isSuccess: false, isError: false });

  // Handle execute success (only on transition from false to true)
  useEffect(() => {
    if (executeProposal.isSuccess && !prevExecuteRef.current.isSuccess) {
      showAlert("success", "Proposal executed successfully!");
      onVoteSuccess(); // Refresh proposal data
    }
    if (executeProposal.isError && !prevExecuteRef.current.isError && executeProposal.error) {
      showAlert("error", executeProposal.error.message);
    }
    prevExecuteRef.current = {
      isSuccess: executeProposal.isSuccess,
      isError: executeProposal.isError,
    };
  }, [executeProposal.isSuccess, executeProposal.isError, executeProposal.error, showAlert, onVoteSuccess]);

  const handleExecute = async () => {
    try {
      await executeProposal.execute(proposal.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execute failed";
      showAlert("error", message);
    }
  };

  const isExecuting = executeProposal.isPending || executeProposal.isConfirming;

  return (
    <div className="mt-6 border border-parchment/20 bg-parchment/5 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-parchment/10">
        <div className="flex items-center gap-3">
          <h3 className="font-arizona-serif text-xl">
            Proposal #{proposal.id.toString()}
          </h3>
          <VotingResultBadge state={proposal.state} />
        </div>
        {proposal.uri && (
          <p className="text-parchment/70 font-arizona-text">{proposal.uri}</p>
        )}
      </div>

      {/* Success message for passed proposals in Queued phase */}
      {currentPhase === "Queued" && quorumMet && yeaMet && minVotesMet && (
        <div className="mx-6 mt-6 p-4 bg-chartreuse/10 border border-chartreuse/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-chartreuse flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-oracle-standard text-chartreuse">Proposal Passed</p>
              <p className="text-sm text-parchment/70 mt-1">
                This proposal has met all voting requirements and will be executable starting {formatDateTime(queuedThrough)}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ready to execute banner for Executable phase */}
      {currentPhase === "Executable" && proposal.state === ProposalState.Executable && (
        <div className="mx-6 mt-6 p-4 bg-aqua/10 border border-aqua/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-aqua flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="font-oracle-standard text-aqua">Ready to Execute</p>
                <p className="text-sm text-parchment/70 mt-1">
                  This proposal has passed and can now be executed. Anyone can execute it before it expires on {formatDateTime(executableThrough)}.
                </p>
              </div>
            </div>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-4 py-2 bg-aqua text-ink font-oracle-standard hover:bg-aqua/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isExecuting ? "Executing..." : "Execute Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* Executed success message */}
      {proposal.state === ProposalState.Executed && (
        <div className="mx-6 mt-6 p-4 bg-aqua/10 border border-aqua/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-aqua flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-oracle-standard text-aqua">Proposal Executed</p>
              <p className="text-sm text-parchment/70 mt-1">
                This proposal has been successfully executed and its actions have been applied.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired message - proposal passed but wasn't executed in time */}
      {proposal.state === ProposalState.Expired && (
        <div className="mx-6 mt-6 p-4 bg-orchid/10 border border-orchid/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-orchid flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-oracle-standard text-orchid">Proposal Expired</p>
              <p className="text-sm text-parchment/70 mt-1">
                This proposal passed all voting requirements but was not executed within the grace period.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected message - proposal failed to meet requirements */}
      {proposal.state === ProposalState.Rejected && (
        <div className="mx-6 mt-6 p-4 bg-orchid/10 border border-orchid/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-orchid flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-oracle-standard text-orchid">Proposal Rejected</p>
              <p className="text-sm text-parchment/70 mt-1">
                This proposal did not meet the voting requirements and has been rejected.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-12 p-6">
        {/* Left column - Details */}
        <div className={`space-y-4 ${votingOver ? "opacity-60" : ""}`}>
          {/* Vote Distribution */}
          <div className="mb-6">
            <h4 className="font-oracle-standard text-sm mb-2 text-parchment/80">
              Vote Distribution
            </h4>
            <VoteBar ballot={ballot} />
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-oracle-standard text-sm text-parchment/80">
                Timeline
              </h4>
              <span className={`px-2 py-0.5 text-xs ${PHASE_STYLES[currentPhase]}`}>
                {currentPhase}
              </span>
            </div>
            <div className="my-5">
              <ProposalTimeline proposal={proposal} />
            </div>
            <div className="space-y-1 text-sm">
              <div className="group flex justify-between items-center cursor-default">
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">Created:</span>
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">{formatDateTime(creationTimestamp)}</span>
              </div>
              <div className="group flex justify-between items-center cursor-default">
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">Voting starts:</span>
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">{formatDateTime(pendingThrough)}</span>
              </div>
              <div className="group flex justify-between items-center cursor-default">
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">Voting ends:</span>
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">{formatDateTime(activeThrough)}</span>
              </div>
              <div className="group flex justify-between items-center cursor-default">
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">Executable from:</span>
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">{formatDateTime(queuedThrough)}</span>
              </div>
              <div className="group flex justify-between items-center cursor-default">
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">Expires:</span>
                <span className="text-parchment/50 transition-colors group-hover:text-parchment">{formatDateTime(executableThrough)}</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="font-oracle-standard text-sm mb-2 text-parchment/80">
              Requirements
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-parchment/50 inline-flex items-center gap-1">
                  Quorum ({quorumPct}%):
                  <TooltipIcon
                    content={`At least ${quorumPct}% of the total voting power at the start of the voting period must participate in this vote for it to be valid.`}
                    position="top"
                  />
                </span>
                <span className={quorumMet ? "text-chartreuse" : votingOver ? "text-orchid" : "text-parchment/70"}>
                  {participationPct.toFixed(1)}% participated {quorumMet ? "✓" : votingOver ? "✗" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-parchment/50">Yes votes ({requiredYeaPercentage.toFixed(1)}% needed):</span>
                <span className={yeaMet ? "text-chartreuse" : votingOver ? "text-orchid" : "text-parchment/70"}>
                  {yeaPercentage.toFixed(1)}% {yeaMet ? "✓" : votingOver ? "✗" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-parchment/50 inline-flex items-center gap-1">
                  Min total power:
                  <TooltipIcon
                    content="The total voting power at snapshot time must exceed this threshold for the proposal to be valid. This ensures meaningful participation is possible."
                    position="top"
                  />
                </span>
                <span className={minVotesMet ? "text-chartreuse" : votingOver ? "text-orchid" : "text-parchment/70"}>
                  {Number(formatUnits(config.minimumVotes, 18)).toLocaleString()} tokens {minVotesMet ? "✓" : votingOver ? "✗" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <h4 className="font-oracle-standard text-sm mb-2 text-parchment/80">
              Addresses
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-parchment/50">Proposer:</span>
                <a
                  href={getExplorerAddressUrl(proposal.proposerAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-parchment/70 hover:text-parchment/80 hover:underline"
                >
                  {shortenAddress(proposal.proposerAddress)}
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" />
                  </svg>
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-parchment/50">Payload:</span>
                <a
                  href={getExplorerAddressUrl(proposal.payloadAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-parchment/70 hover:text-parchment/80 hover:underline"
                >
                  {shortenAddress(proposal.payloadAddress)}
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" />
                  </svg>
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-parchment/50">Votes:</span>
                <a
                  href={`${getExplorerBaseUrl()}/address/${contracts.governance.address}#events&topic0=${keccak256(toBytes("VoteCast(uint256,address,bool,uint256)"))}&topic1=${pad(toHex(proposal.id), { size: 32 })}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-parchment/70 hover:text-parchment/80 hover:underline"
                >
                  View on Etherscan
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Voting */}
        <div>
          <VotingPanel
            proposal={proposal}
            votingPower={votingPower}
            ballots={ballots}
            directSnapshotPower={directSnapshotPower}
            currentTotalPower={currentTotalPower}
            delegatedVotingPower={delegatedVotingPower}
            onVoteSuccess={onVoteSuccess}
            rejectionReason={proposal.state === ProposalState.Rejected ? rejectionReason : RejectionReason.None}
          />
        </div>
      </div>
    </div>
  );
}
