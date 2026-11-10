import { Tooltip } from "@/components/Tooltip";
import {
  MilestoneStatus,
  getMilestoneStatusText,
  getMilestoneStatusColors,
} from "@/hooks/atpRegistry/useMilestoneStatus";

interface MilestoneStatusBadgeProps {
  status?: MilestoneStatus;
  isLoading?: boolean;
  showTooltip?: boolean;
}

export const MilestoneStatusBadge = ({
  status,
  isLoading,
  showTooltip = true
}: MilestoneStatusBadgeProps) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-oracle-standard font-bold uppercase tracking-wider glass text-parchment/60">
        Loading...
      </span>
    );
  }

  if (status === undefined) return null;

  const statusText = getMilestoneStatusText(status);
  const colors = getMilestoneStatusColors(status);

  const tooltipContent = {
    [MilestoneStatus.Pending]:
      "This milestone has not been reached yet. Withdrawals are disabled.",
    [MilestoneStatus.Failed]:
      "This milestone was not achieved. Withdrawals are disabled.",
    [MilestoneStatus.Succeeded]:
      "This milestone has been successfully achieved.",
  }[status];

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-oracle-standard font-bold uppercase tracking-wider border rounded-btn ${colors.border} ${colors.bg} ${colors.text}`}
      aria-label={`Milestone status: ${statusText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
      Milestone: {statusText}
    </span>
  );

  if (!showTooltip) return badge;

  return <Tooltip content={tooltipContent}>{badge}</Tooltip>;
};
