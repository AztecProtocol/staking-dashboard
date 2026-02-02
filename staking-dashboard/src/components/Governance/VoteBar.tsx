import type { Ballot } from "@/hooks/governance";
import { getYeaPercentage, getNayPercentage } from "@/hooks/governance";
import { formatCompact } from "@/utils/formatNumber";

interface VoteBarProps {
  ballot: Ballot;
  showLabels?: boolean;
  size?: "xs" | "sm" | "default";
}

const sizeClasses = {
  xs: "h-2",
  sm: "h-3",
  default: "h-6",
};

export function VoteBar({ ballot, showLabels = true, size = "default" }: VoteBarProps) {
  const heightClass = sizeClasses[size];
  const yeaPct = getYeaPercentage(ballot);
  const nayPct = getNayPercentage(ballot);
  const total = ballot.yea + ballot.nay;

  if (total === 0n) {
    return (
      <div className="w-full">
        {showLabels && (
          <div className="flex justify-between text-sm text-parchment/50 mb-2">
            <span>No votes yet</span>
          </div>
        )}
        <div className={`${heightClass} bg-parchment/10`} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-chartreuse">
            Yes: {yeaPct.toFixed(1)}% ({formatCompact(ballot.yea)})
          </span>
          <span className="text-orchid">
            No: {nayPct.toFixed(1)}% ({formatCompact(ballot.nay)})
          </span>
        </div>
      )}
      <div className={`${heightClass} bg-parchment/10 overflow-hidden flex`}>
        {yeaPct > 0 && (
          <div
            className="h-full bg-chartreuse transition-all duration-300"
            style={{ width: `${yeaPct}%` }}
          />
        )}
        {nayPct > 0 && (
          <div
            className="h-full bg-orchid transition-all duration-300"
            style={{ width: `${nayPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
