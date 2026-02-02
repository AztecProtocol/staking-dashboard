import { useState, useMemo, useEffect, useRef } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import type { Proposal, UserVotingPower, BallotsBySource, StakerVotingPower } from "@/hooks/governance";
import { isVotingOpen, ProposalState, RejectionReason, getRejectionMessage } from "@/hooks/governance";
import { useGovernanceVote, useVoteInGovernance, useGSEVote } from "@/hooks/governance";
import { formatCompact } from "@/utils/formatNumber";
import { useAlert } from "@/contexts/AlertContext";

interface DelegatedVotingPowerResult {
  totalPower: bigint;
  currentPower: bigint;
  isLoading: boolean;
  error: Error | null;
}

interface VotingPanelProps {
  proposal: Proposal;
  votingPower: UserVotingPower;
  ballots: BallotsBySource;
  directSnapshotPower?: bigint;
  currentTotalPower?: bigint;
  delegatedVotingPower?: DelegatedVotingPowerResult;
  onVoteSuccess: () => void;
  rejectionReason?: RejectionReason;
}

// Voting source can be "direct" (deposited tokens), a token vault, or delegated (staked) power
type VotingSource =
  | { type: "direct" }
  | { type: "staker"; staker: StakerVotingPower }
  | { type: "delegated"; power: bigint };

// Get contextual message for non-voting states
function getVotingClosedMessage(state: ProposalState): string {
  switch (state) {
    case ProposalState.Pending:
      return "Voting has not started yet";
    case ProposalState.Queued:
    case ProposalState.Executable:
      return "Voting has ended";
    case ProposalState.Rejected:
      return "Proposal Rejected";
    case ProposalState.Executed:
      return "Proposal was executed";
    case ProposalState.Droppable:
    case ProposalState.Dropped:
      return "Proposal was dropped";
    case ProposalState.Expired:
      return "Proposal has expired";
    default:
      return "Voting is not open for this proposal";
  }
}

export function VotingPanel({
  proposal,
  votingPower,
  ballots,
  directSnapshotPower,
  currentTotalPower,
  delegatedVotingPower,
  onVoteSuccess,
  rejectionReason,
}: VotingPanelProps) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  // Use snapshot power for direct voting if available (what the contract allows)
  const effectiveDirectPower = directSnapshotPower ?? votingPower.directPower;

  // Delegated voting power (from staked positions delegated to this user)
  // totalPower = snapshot power (usable for this proposal)
  // currentPower = current power (may differ if delegation happened after snapshot)
  const effectiveDelegatedPower = delegatedVotingPower?.totalPower ?? 0n;
  const currentDelegatedPower = delegatedVotingPower?.currentPower ?? 0n;

  // Direct voting source (deposited tokens)
  const directSources = useMemo(() => {
    const sources: VotingSource[] = [];
    if (effectiveDirectPower > 0n) {
      sources.push({ type: "direct" });
    }
    return sources;
  }, [effectiveDirectPower]);

  // Token vault sources
  const vaultSources = useMemo(() => {
    const sources: VotingSource[] = [];
    for (const staker of votingPower.stakerPowers) {
      if (staker.power > 0n) {
        sources.push({ type: "staker", staker });
      }
    }
    return sources;
  }, [votingPower.stakerPowers]);

  // Delegated voting power source (from staked positions)
  // Show if user has CURRENT delegated power (even if snapshot power is 0)
  const delegatedSources = useMemo(() => {
    const sources: VotingSource[] = [];
    // Use the higher of current or snapshot power for display
    // But only snapshot power (effectiveDelegatedPower) can actually be used for voting
    const displayPower = currentDelegatedPower > effectiveDelegatedPower ? currentDelegatedPower : effectiveDelegatedPower;
    if (displayPower > 0n) {
      sources.push({ type: "delegated", power: effectiveDelegatedPower });
    }
    return sources;
  }, [effectiveDelegatedPower, currentDelegatedPower]);

  // Check if user has more current delegated power than they can use for this proposal
  const hasDelegatedPowerMismatch = currentDelegatedPower > effectiveDelegatedPower;

  // Combined sources for indexing
  const availableSources = useMemo(() => {
    return [...directSources, ...vaultSources, ...delegatedSources];
  }, [directSources, vaultSources, delegatedSources]);

  // Default to first available source
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const selectedSource = availableSources[selectedSourceIndex] ?? null;

  // Get the staker address for the selected source (if it's a staker)
  const selectedStakerAddress = selectedSource?.type === "staker"
    ? selectedSource.staker.stakerAddress
    : undefined;

  const directVote = useGovernanceVote();
  const stakerVote = useVoteInGovernance(selectedStakerAddress);
  const gseVote = useGSEVote();
  const { showAlert } = useAlert();

  // Calculate remaining direct power (for button display)
  const remainingDirectPower = useMemo(() => {
    const basePower = directSnapshotPower ?? votingPower.directPower;
    const directBallot = ballots.get("direct");
    const usedPower = directBallot ? directBallot.yea + directBallot.nay : 0n;
    return basePower - usedPower;
  }, [directSnapshotPower, votingPower.directPower, ballots]);

  // Calculate remaining power for each staker (for button display)
  const remainingStakerPower = useMemo(() => {
    const powerMap = new Map<string, bigint>();
    for (const staker of votingPower.stakerPowers) {
      const stakerBallot = ballots.get(staker.stakerAddress);
      const usedPower = stakerBallot ? stakerBallot.yea + stakerBallot.nay : 0n;
      powerMap.set(staker.stakerAddress, staker.power - usedPower);
    }
    return powerMap;
  }, [votingPower.stakerPowers, ballots]);

  // Total available power across all sources (including delegated)
  const totalAvailablePower = useMemo(() => {
    let total = remainingDirectPower;
    for (const power of remainingStakerPower.values()) {
      total += power;
    }
    // Add delegated power (TODO: track used delegated power from GSE)
    total += effectiveDelegatedPower;
    return total;
  }, [remainingDirectPower, remainingStakerPower, effectiveDelegatedPower]);

  // Calculate total snapshot power (for this proposal) to compare with current power
  const snapshotTotalPower = useMemo(() => {
    let total = directSnapshotPower ?? votingPower.directPower;
    for (const staker of votingPower.stakerPowers) {
      total += staker.power;
    }
    return total;
  }, [directSnapshotPower, votingPower.directPower, votingPower.stakerPowers]);

  // Check if voting power differs between proposal snapshot and current
  const hasPowerMismatch = currentTotalPower !== undefined && snapshotTotalPower !== currentTotalPower;

  // Get available power for selected source (subtracting already-cast votes)
  // For direct voting, use snapshot power (power at proposal creation + voting delay)
  // since that's what the contract uses for vote validation
  const availablePower = useMemo(() => {
    if (!selectedSource) return 0n;
    if (selectedSource.type === "direct") {
      return remainingDirectPower;
    }
    if (selectedSource.type === "delegated") {
      // For delegated power, return the full amount (TODO: track used from GSE.getPowerUsed)
      return selectedSource.power;
    }
    // Staker power - use pre-calculated remaining power
    return remainingStakerPower.get(selectedSource.staker.stakerAddress) ?? 0n;
  }, [selectedSource, remainingDirectPower, remainingStakerPower]);

  // Check if user has any votes on this proposal
  const hasAnyVotes = useMemo(() => {
    for (const ballot of ballots.values()) {
      if (ballot.yea > 0n || ballot.nay > 0n) return true;
    }
    return false;
  }, [ballots]);

  // Track previous success states to detect transitions
  const prevSuccessRef = useRef({
    directVote: false,
    stakerVote: false,
    gseVote: false,
  });

  // Refetch data when transactions are confirmed on-chain
  useEffect(() => {
    const prev = prevSuccessRef.current;

    // Direct vote confirmed
    if (directVote.isSuccess && !prev.directVote) {
      setAmount("");
      onVoteSuccess();
    }

    // Staker vote confirmed
    if (stakerVote.isSuccess && !prev.stakerVote) {
      setAmount("");
      onVoteSuccess();
    }

    // GSE (delegated) vote confirmed
    if (gseVote.isSuccess && !prev.gseVote) {
      setAmount("");
      onVoteSuccess();
    }

    // Update previous states
    prevSuccessRef.current = {
      directVote: directVote.isSuccess,
      stakerVote: stakerVote.isSuccess,
      gseVote: gseVote.isSuccess,
    };
  }, [directVote.isSuccess, stakerVote.isSuccess, gseVote.isSuccess, onVoteSuccess]);

  const handleVote = async (support: boolean) => {
    const parsedAmount = parseUnits(amount || "0", 18);
    if (parsedAmount === 0n || !selectedSource) return;

    try {
      if (selectedSource.type === "direct") {
        await directVote.vote(proposal.id, parsedAmount, support);
      } else if (selectedSource.type === "delegated") {
        await gseVote.vote(proposal.id, parsedAmount, support);
      } else {
        await stakerVote.vote(proposal.id, parsedAmount, support);
      }
      // setAmount and onVoteSuccess are called by useEffect when transaction confirms
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vote failed";
      showAlert("error", message);
    }
  };

  // Watch for transaction errors from hooks
  const prevErrorRef = useRef({ directVote: false, stakerVote: false, gseVote: false });
  useEffect(() => {
    const prev = prevErrorRef.current;
    if (directVote.isError && !prev.directVote && directVote.error) {
      showAlert("error", directVote.error.message);
    }
    if (stakerVote.isError && !prev.stakerVote && stakerVote.error) {
      showAlert("error", stakerVote.error.message);
    }
    if (gseVote.isError && !prev.gseVote && gseVote.error) {
      showAlert("error", gseVote.error.message);
    }
    prevErrorRef.current = {
      directVote: directVote.isError,
      stakerVote: stakerVote.isError,
      gseVote: gseVote.isError,
    };
  }, [directVote.isError, directVote.error, stakerVote.isError, stakerVote.error, gseVote.isError, gseVote.error, showAlert]);

  const isPending = directVote.isPending || stakerVote.isPending || gseVote.isPending;
  const isConfirming = directVote.isConfirming || stakerVote.isConfirming || gseVote.isConfirming;

  if (!isConnected) {
    return (
      <div className="p-4 border border-parchment/20 bg-parchment/5">
        <p className="text-parchment/70 text-center">Connect wallet to participate</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-parchment/20 bg-parchment/5">
      <h4 className="font-oracle-standard text-sm mb-2">
        Cast Your Vote
        {proposal.state !== ProposalState.Pending && (
          <span className="font-normal text-parchment/50">
            {" "}({formatCompact(totalAvailablePower)} available)
          </span>
        )}
      </h4>
      {proposal.state !== ProposalState.Pending && (
        <p className={`text-xs mt-4 mb-4 ${
          hasPowerMismatch
            ? "text-aqua border border-aqua/30 bg-aqua/5 p-2"
            : "text-parchment/50"
        }`}>
          Voting power reflects your balance at the time of proposal creation, not your current holdings.
        </p>
      )}

      {/* User's previous votes from all sources */}
      {hasAnyVotes && (
        <div className="mb-4 p-3 bg-parchment/5 border border-parchment/10">
          <p className="text-sm text-parchment/70 mb-2">Your votes on this proposal:</p>
          <div className="space-y-1 text-sm">
            {/* Direct votes */}
            {(() => {
              const directBallot = ballots.get("direct");
              if (!directBallot || (directBallot.yea === 0n && directBallot.nay === 0n)) return null;
              return (
                <div className="flex justify-between">
                  <span className="text-parchment/50">Wallet:</span>
                  <div className="flex gap-3">
                    {directBallot.yea > 0n && (
                      <span className="text-chartreuse">
                        Yes: {formatCompact(directBallot.yea)}
                      </span>
                    )}
                    {directBallot.nay > 0n && (
                      <span className="text-orchid">
                        No: {formatCompact(directBallot.nay)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
            {/* Token vault votes */}
            {votingPower.stakerPowers.map((staker) => {
              const ballot = ballots.get(staker.stakerAddress);
              if (!ballot || (ballot.yea === 0n && ballot.nay === 0n)) return null;
              return (
                <div key={staker.stakerAddress} className="flex justify-between">
                  <span className="text-parchment/50">
                    Token Vault #{staker.sequentialNumber}:
                  </span>
                  <div className="flex gap-3">
                    {ballot.yea > 0n && (
                      <span className="text-chartreuse">
                        Yes: {formatCompact(ballot.yea)}
                      </span>
                    )}
                    {ballot.nay > 0n && (
                      <span className="text-orchid">
                        No: {formatCompact(ballot.nay)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voting source selection */}
      {availableSources.length > 0 && (
        <div className="mb-4">
          <label className="text-xs text-parchment/50 mb-2 block">Vote Source:</label>
          {availableSources.length > 1 && isVotingOpen(proposal.state) && (
            <p className="text-xs text-aqua mb-2">
              You have multiple vote sources. Select which one to use for this vote.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {availableSources.map((source, index) => {
              const votingDisabled = !isVotingOpen(proposal.state);
              const isSelected = index === selectedSourceIndex && !votingDisabled;

              if (source.type === "direct") {
                return (
                  <button
                    key="direct"
                    onClick={() => setSelectedSourceIndex(index)}
                    disabled={votingDisabled}
                    className={`px-3 py-1 text-sm border transition-colors ${
                      isSelected
                        ? "border-chartreuse bg-chartreuse/10 text-chartreuse"
                        : "border-parchment/20 text-parchment/70 hover:border-parchment/40"
                    } ${votingDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Wallet ({formatCompact(remainingDirectPower)})
                  </button>
                );
              }

              if (source.type === "delegated") {
                // Show effective (snapshot) power - what user can actually use
                // Disable if they have no snapshot power (can't actually vote)
                const canVoteWithDelegated = source.power > 0n;
                return (
                  <button
                    key="delegated"
                    onClick={() => setSelectedSourceIndex(index)}
                    disabled={votingDisabled || !canVoteWithDelegated}
                    className={`px-3 py-1 text-sm border transition-colors ${
                      isSelected && canVoteWithDelegated
                        ? "border-orchid bg-orchid/10 text-orchid"
                        : !canVoteWithDelegated
                        ? "border-parchment/10 text-parchment/40 cursor-not-allowed"
                        : "border-parchment/20 text-parchment/70 hover:border-parchment/40"
                    } ${votingDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Delegated ({formatCompact(source.power)})
                    {!canVoteWithDelegated && " ⚠"}
                  </button>
                );
              }

              const label = `Vault #${source.staker.sequentialNumber}`;
              const remaining = remainingStakerPower.get(source.staker.stakerAddress) ?? 0n;

              return (
                <button
                  key={source.staker.stakerAddress}
                  onClick={() => setSelectedSourceIndex(index)}
                  disabled={votingDisabled}
                  className={`px-3 py-1 text-sm border transition-colors ${
                    isSelected
                      ? "border-chartreuse bg-chartreuse/10 text-chartreuse"
                      : "border-parchment/20 text-parchment/70 hover:border-parchment/40"
                  } ${votingDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {label} ({formatCompact(remaining)})
                </button>
              );
            })}
          </div>
          {/* Message when user has more delegated power than they can use for this proposal */}
          {hasDelegatedPowerMismatch && isVotingOpen(proposal.state) && (
            <p className="text-xs text-aqua mt-2">
              You have {formatCompact(currentDelegatedPower)} delegated voting power, but {formatCompact(currentDelegatedPower - effectiveDelegatedPower)} was delegated after voting started for this proposal and cannot be used here.
              {effectiveDelegatedPower > 0n && ` You can vote with ${formatCompact(effectiveDelegatedPower)}.`}
            </p>
          )}
        </div>
      )}

      {/* Available power display */}
      {/* <div className="mb-4">
        <p className="text-xs text-parchment/50">
          Available voting power: {formatUnits(availablePower, 18)} tokens
        </p>
      </div> */}

      {!isVotingOpen(proposal.state) ? (
        <div className="p-4 border border-parchment/30 bg-parchment/10 text-center">
          <p className="text-parchment font-oracle-standard">
            {getVotingClosedMessage(proposal.state)}
          </p>
          {proposal.state === ProposalState.Rejected && rejectionReason && rejectionReason !== RejectionReason.None && (
            <p className="text-parchment/50 text-sm mt-1">
              {getRejectionMessage(rejectionReason)}
            </p>
          )}
        </div>
      ) : availablePower === 0n ? (
        <div className="p-4 border border-orchid/30 bg-orchid/10 text-center">
          <p className="text-orchid font-oracle-standard">
            No voting power available
          </p>
          <p className="text-xs text-parchment/50 mt-1">
            You have used all your voting power for this proposal
          </p>
        </div>
      ) : (
        <>
          {/* Amount input for voting */}
          <div className="mb-4">
            <label className="text-xs text-parchment/50 mb-1 block">Amount to vote:</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none"
              />
              <button
                onClick={() => setAmount(formatUnits(availablePower, 18))}
                className="px-3 py-2 text-xs border border-parchment/20 text-parchment/70 hover:border-parchment/40"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Vote buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleVote(true)}
              disabled={isPending || isConfirming || !amount}
              className="flex-1 px-4 py-2 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? "..." : "Vote Yes"}
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isPending || isConfirming || !amount}
              className="flex-1 px-4 py-2 bg-orchid text-ink font-oracle-standard hover:bg-orchid/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? "..." : "Vote No"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
