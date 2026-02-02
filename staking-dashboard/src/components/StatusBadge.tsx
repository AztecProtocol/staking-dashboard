import { SequencerStatus } from "@/hooks/rollup/useSequencerStatus"
import { Icon } from "@/components/Icon"

interface StatusBadgeProps {
  status: SequencerStatus | undefined
  statusLabel: string
  isLoading: boolean
  isUnstaked: boolean
  isInQueue: boolean
  slashCount?: number
  isAtRisk?: boolean
}

/**
 * Reusable status badge component for displaying stake/delegation status
 * Shows a warning indicator when the sequencer has been slashed
 */
export const StatusBadge = ({
  status,
  statusLabel,
  isLoading,
  isUnstaked,
  isInQueue,
  slashCount = 0,
  isAtRisk = false,
}: StatusBadgeProps) => {
  const getBadgeClasses = () => {
    if (isUnstaked) return 'bg-parchment/10 border-parchment/30'
    if (isInQueue) return 'bg-aqua/10 border-aqua/30'
    if (status === SequencerStatus.VALIDATING) return 'bg-chartreuse/10 border-chartreuse/30'
    if (status === SequencerStatus.EXITING) return 'bg-orchid/10 border-orchid/30'
    if (status === SequencerStatus.ZOMBIE) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-parchment/10 border-parchment/30'
  }

  const getTextClasses = () => {
    if (isUnstaked) return 'text-parchment/60'
    if (isInQueue) return 'text-aqua'
    if (status === SequencerStatus.VALIDATING) return 'text-chartreuse'
    if (status === SequencerStatus.EXITING) return 'text-orchid'
    if (status === SequencerStatus.ZOMBIE) return 'text-yellow-500'
    return 'text-parchment/60'
  }

  const getLabel = () => {
    if (isLoading) return '...'
    if (isUnstaked) return 'Withdrawn'
    if (isInQueue) return 'In Queue'
    return statusLabel
  }

  // Show slash warning only for validating sequencers that have been slashed
  const showSlashWarning = slashCount > 0 && status === SequencerStatus.VALIDATING

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 border rounded-sm ${getBadgeClasses()}`}>
      {showSlashWarning && (
        <Icon
          name="warning"
          size="sm"
          className={isAtRisk ? 'text-vermillion' : 'text-yellow-500'}
        />
      )}
      <span className={`text-xs font-oracle-standard font-bold uppercase tracking-wide ${getTextClasses()}`}>
        {getLabel()}
      </span>
      {showSlashWarning && (
        <span className={`text-xs font-mono ${isAtRisk ? 'text-vermillion' : 'text-yellow-500'}`}>
          ({slashCount})
        </span>
      )}
    </div>
  )
}
