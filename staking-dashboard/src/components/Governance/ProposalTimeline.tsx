import { useBlock } from "wagmi";
import type { Proposal } from "@/hooks/governance";
import {
  getPendingThrough,
  getActiveThrough,
  getQueuedThrough,
  getExecutableThrough,
  isTerminalState,
} from "@/hooks/governance";

interface ProposalTimelineProps {
  proposal: Proposal;
}

interface PhaseConfig {
  label: string;
  bgColor: string;
  order: number;
}

const PHASES: PhaseConfig[] = [
  { label: "Pending", bgColor: "bg-parchment/40", order: 0 },
  { label: "Voting Live", bgColor: "bg-chartreuse", order: 1 },
  { label: "Queued", bgColor: "bg-orchid", order: 2 },
  { label: "Exec", bgColor: "bg-aqua", order: 3 },
];

export function ProposalTimeline({ proposal }: ProposalTimelineProps) {
  const { config, creationTimestamp } = proposal;

  // Use blockchain timestamp instead of browser time (important for local Anvil testing)
  const { data: block } = useBlock({ watch: true });
  const now = block?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));

  // Calculate phase boundaries
  const pendingEnd = getPendingThrough(creationTimestamp, config);
  const activeEnd = getActiveThrough(creationTimestamp, config);
  const queuedEnd = getQueuedThrough(creationTimestamp, config);
  const executableEnd = getExecutableThrough(creationTimestamp, config);

  // Calculate total duration and phase durations
  const totalDuration = Number(executableEnd - creationTimestamp);
  const pendingDuration = Number(config.votingDelay);
  const activeDuration = Number(config.votingDuration);
  const queuedDuration = Number(config.executionDelay);
  const execDuration = Number(config.gracePeriod);

  // Calculate percentage widths
  const pendingWidth = (pendingDuration / totalDuration) * 100;
  const activeWidth = (activeDuration / totalDuration) * 100;
  const queuedWidth = (queuedDuration / totalDuration) * 100;
  const execWidth = (execDuration / totalDuration) * 100;

  const widths = [pendingWidth, activeWidth, queuedWidth, execWidth];

  // Calculate current time indicator position (as percentage)
  // Don't show indicator for terminal states (executed, rejected, dropped, expired)
  let currentPosition: number | null = null;
  if (now >= creationTimestamp && now <= executableEnd && !isTerminalState(proposal.state)) {
    currentPosition =
      (Number(now - creationTimestamp) / totalDuration) * 100;
  }

  // Determine phase status based on current time position
  const getPhaseStatus = (phase: PhaseConfig): "completed" | "active" | "future" => {
    // Get phase end timestamps
    const phaseEnds: Record<number, bigint> = {
      0: pendingEnd,    // Pending ends at pendingEnd
      1: activeEnd,     // Active ends at activeEnd
      2: queuedEnd,     // Queued ends at queuedEnd
      3: executableEnd, // Exec ends at executableEnd
    };

    // Get phase start timestamps
    const phaseStarts: Record<number, bigint> = {
      0: creationTimestamp,
      1: pendingEnd,
      2: activeEnd,
      3: queuedEnd,
    };

    const phaseStart = phaseStarts[phase.order];
    const phaseEnd = phaseEnds[phase.order];

    if (now >= phaseEnd) return "completed";
    if (now >= phaseStart) return "active";
    return "future";
  };

  return (
    <div className="w-full">
      {/* Phase labels */}
      <div className="flex text-xs text-parchment/70 mb-1">
        {PHASES.map((phase, index) => {
          const status = getPhaseStatus(phase);
          return (
            <div
              key={phase.label}
              className="text-center"
              style={{ width: `${widths[index]}%` }}
            >
              <span
                className={
                  status === "active"
                    ? "text-parchment font-medium"
                    : status === "future"
                      ? "text-parchment/40"
                      : ""
                }
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline bar */}
      <div className="relative h-2">
        <div className="h-full overflow-hidden flex">
          {PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase);
            const isFuture = status === "future";
            return (
              <div
                key={phase.label}
                className={`h-full ${isFuture ? "bg-black/30" : phase.bgColor} ${
                  index > 0 ? "border-l border-parchment/20" : ""
                }`}
                style={{ width: `${widths[index]}%` }}
              />
            );
          })}
        </div>

        {/* Current time indicator - vertical line */}
        {currentPosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#251f0b]"
            style={{
              left: `${currentPosition}%`,
              transform: 'translateX(-50%)',
            }}
          />
        )}

        {/* Current time indicator - triangle pointing up below the bar */}
        {currentPosition !== null && (
          <div
            className="absolute top-full"
            style={{
              left: `${currentPosition}%`,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              marginTop: '2px',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '6px solid white',
            }}
          />
        )}
      </div>

    </div>
  );
}
