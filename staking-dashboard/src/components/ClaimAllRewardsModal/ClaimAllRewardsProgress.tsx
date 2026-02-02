import { Icon } from "@/components/Icon"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import type { ClaimTask } from "@/hooks/rewards/useClaimAllRewards"

interface ClaimAllRewardsProgressProps {
  tasks: ClaimTask[]
  currentTask: ClaimTask | null
  progressPercent: number
  decimals: number
  symbol: string
  onCancel: () => void
  isError: boolean
  error: Error | null
  onRetry: () => void
}

/**
 * Progress view showing claiming status for each task
 */
export const ClaimAllRewardsProgress = ({
  tasks,
  currentTask,
  progressPercent,
  decimals,
  symbol,
  onCancel,
  isError,
  error,
  onRetry
}: ClaimAllRewardsProgressProps) => {
  const completedCount = tasks.filter(t => t.status === 'completed').length

  const getSubStepText = (subStep?: string) => {
    switch (subStep) {
      case 'claiming': return 'Claiming from rollup...'
      case 'distributing': return 'Distributing to warehouse...'
      case 'withdrawing': return 'Withdrawing to wallet...'
      default: return 'Processing...'
    }
  }

  const getStatusIcon = (status: ClaimTask['status']) => {
    switch (status) {
      case 'completed':
        return <Icon name="check" size="sm" className="text-chartreuse" />
      case 'processing':
        return <Icon name="loader" size="sm" className="animate-spin text-chartreuse" />
      case 'error':
        return <Icon name="x" size="sm" className="text-red-400" />
      case 'skipped':
        return <Icon name="x" size="sm" className="text-parchment/40" />
      default:
        return <div className="w-4 h-4 border border-parchment/30 rounded-full" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-parchment/60">
            Progress: {completedCount} of {tasks.length} claims
          </span>
          <span className="text-sm font-mono text-chartreuse">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-parchment/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-chartreuse transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {isError && error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4">
          <div className="flex items-start gap-3">
            <Icon name="alertCircle" size="md" className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-bold text-sm">Transaction Failed</p>
              <p className="text-parchment/60 text-xs mt-1">
                {error.message.includes('rejected')
                  ? 'Transaction was rejected. You can retry or cancel.'
                  : error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`border p-3 transition-colors ${
              task.status === 'processing'
                ? 'bg-chartreuse/5 border-chartreuse/40'
                : task.status === 'completed'
                  ? 'bg-chartreuse/5 border-chartreuse/20'
                  : task.status === 'error'
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-parchment/5 border-parchment/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(task.status)}
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 ${
                    task.type === 'delegation'
                      ? 'bg-chartreuse/20 text-chartreuse'
                      : 'bg-parchment/20 text-parchment/80'
                  }`}>
                    {task.type === 'delegation' ? 'Delegation' : 'Coinbase'}
                  </span>
                  <span className="text-sm text-parchment truncate">
                    {task.displayName}
                  </span>
                </div>

                {/* Sub-step for processing delegations */}
                {task.status === 'processing' && task.type === 'delegation' && (
                  <div className="mt-1 text-xs text-chartreuse">
                    {getSubStepText(task.currentSubStep)}
                  </div>
                )}

                {/* Processing indicator for coinbase */}
                {task.status === 'processing' && task.type === 'coinbase' && (
                  <div className="mt-1 text-xs text-chartreuse">
                    Claiming rewards...
                  </div>
                )}

                {/* Error message */}
                {task.status === 'error' && task.error && (
                  <div className="mt-1 text-xs text-red-400 truncate">
                    {task.error.message.includes('rejected') ? 'Rejected by user' : 'Failed'}
                  </div>
                )}
              </div>

              {/* Rewards Amount */}
              <div className="flex-shrink-0 text-right">
                <span className={`font-mono text-sm ${
                  task.status === 'completed'
                    ? 'text-chartreuse'
                    : task.status === 'error'
                      ? 'text-red-400'
                      : 'text-parchment/60'
                }`}>
                  {formatTokenAmountFull(task.estimatedRewards, decimals, symbol)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Task Detail */}
      {currentTask && !isError && (
        <div className="bg-ink border border-chartreuse/40 p-4">
          <div className="flex items-center gap-3">
            <Icon name="loader" size="md" className="animate-spin text-chartreuse" />
            <div>
              <p className="text-parchment font-bold text-sm">
                Claiming from {currentTask.displayName}
              </p>
              {currentTask.type === 'delegation' && currentTask.currentSubStep && (
                <p className="text-chartreuse text-xs mt-0.5">
                  Step {currentTask.currentSubStep === 'claiming' ? '1' : currentTask.currentSubStep === 'distributing' ? '2' : '3'} of 3: {getSubStepText(currentTask.currentSubStep)}
                </p>
              )}
              {currentTask.type === 'coinbase' && (
                <p className="text-chartreuse text-xs mt-0.5">
                  Waiting for transaction confirmation...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isError ? (
          <>
            <button
              onClick={onRetry}
              className="flex-1 py-3 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all"
            >
              Retry Failed
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-parchment/40 text-parchment font-oracle-standard font-bold text-sm uppercase tracking-wider hover:border-parchment/60 transition-all"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onCancel}
            className="w-full py-3 border border-parchment/40 text-parchment font-oracle-standard font-bold text-sm uppercase tracking-wider hover:border-parchment/60 transition-all"
          >
            Cancel Remaining
          </button>
        )}
      </div>

      {/* Info */}
      {!isError && (
        <p className="text-xs text-parchment/40 text-center">
          Please approve each transaction in your wallet. Do not close this modal.
        </p>
      )}
    </div>
  )
}
