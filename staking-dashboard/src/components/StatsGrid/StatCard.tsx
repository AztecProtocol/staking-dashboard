import { TooltipIcon } from "@/components/Tooltip"

interface StatCardProps {
  title: string
  value: string
  change: string
  delay?: string
}

/**
 * Individual statistic card component
 * Displays a single metric with title, value, and change indicator
 */
export const StatCard = ({ title, value, change, delay }: StatCardProps) => {
  return (
    <div
      className="bg-ink/8 bg-stats-accent border border-parchment/20 p-4 sm:p-6 md:p-8 backdrop-blur-sm hover:bg-parchment/12 hover:-translate-y-1 hover:border-chartreuse transition-all duration-300 opacity-0 animate-fade-up relative overflow-hidden"
      style={delay ? { animationDelay: delay } : undefined}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-1 mb-4">
          <div className="font-francesco text-xs sm:text-sm uppercase tracking-wide-8 text-chartreuse font-medium">
            {title}
          </div>
          <TooltipIcon
            content={
              title === "Total Value Locked" ? "Total value of all AZTEC tokens currently staked in the protocol." :
              title === "Current APR" ? "Average annual percentage rate for staking rewards across all validators." :
              title === "Total Stakes" ? "Total number of staking positions in the protocol." :
              "Total AZTEC tokens distributed as staking rewards to all participants."
            }
            size="sm"
            maxWidth="max-w-xs"
          />
        </div>
        <div className="font-arizona-serif text-h4 font-semibold mb-2 text-parchment">
          {value}
        </div>
        <div className="font-arizona-text text-sm text-aqua">{change}</div>
      </div>
    </div>
  )
};