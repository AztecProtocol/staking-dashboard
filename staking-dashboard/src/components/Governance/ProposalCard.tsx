import type { Proposal } from "@/hooks/governance";
import { getStateLabel, isTerminalState, isVotingOpen, ProposalState } from "@/hooks/governance";
import { VoteBar } from "./VoteBar";

interface ProposalCardProps {
  proposal: Proposal;
  isSelected: boolean;
  onClick: () => void;
}

function isUrl(str: string): boolean {
  return str.startsWith("https://") || str.startsWith("http://");
}

function getStateBadgeStyles(state: ProposalState): string {
  if (isVotingOpen(state)) {
    return "bg-chartreuse/20 text-chartreuse border-chartreuse/30";
  }
  if (state === ProposalState.Pending) {
    return "bg-aqua/20 text-aqua border-aqua/30";
  }
  if (state === ProposalState.Executed) {
    return "bg-chartreuse/20 text-chartreuse border-chartreuse/30";
  }
  if (isTerminalState(state)) {
    return "bg-orchid/20 text-orchid border-orchid/30";
  }
  return "bg-parchment/10 text-parchment/70 border-parchment/20";
}

export function ProposalCard({ proposal, isSelected, onClick }: ProposalCardProps) {
  const stateLabel = getStateLabel(proposal.state);
  const badgeStyles = getStateBadgeStyles(proposal.state);

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-64 p-4 border transition-all text-left
        ${isSelected
          ? "border-chartreuse bg-chartreuse/5"
          : "border-parchment/20 bg-parchment/5 hover:border-parchment/40"
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-oracle-standard text-sm text-parchment/70">
          Proposal #{proposal.id.toString()}
        </span>
        <span className={`px-2 py-0.5 text-xs border ${badgeStyles}`}>
          {stateLabel}
        </span>
      </div>

      <h4 className="font-arizona-serif text-lg mb-3 line-clamp-2">
        {proposal.uri ? (
          isUrl(proposal.uri) ? (
            <a
              href={proposal.uri}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-aqua hover:underline"
            >
              {proposal.uri}
            </a>
          ) : (
            proposal.uri
          )
        ) : (
          `Proposal ${proposal.id.toString()}`
        )}
      </h4>

      <VoteBar ballot={proposal.ballot} showLabels={false} size="xs" />
    </button>
  );
}
