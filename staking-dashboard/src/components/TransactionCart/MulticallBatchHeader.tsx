import { Icon } from "@/components/Icon"
import type { CartTransaction } from "@/contexts/TransactionCartContext"

interface MulticallBatchHeaderProps {
  /** Entries that will be bundled into a single Multicall3 transaction. */
  transactions: CartTransaction[]
  isExpanded: boolean
  onToggle: () => void
  /** Whether at least one of the wrapped entries is currently executing. */
  isExecuting: boolean
}

/**
 * Header row that wraps the cart entries that will run through Multicall3.
 * Communicates "this whole list will be one wallet signature, not N" — and
 * doubles as a dropdown affordance to fold the individual entries away.
 *
 * Renders only when the cart's pending entries are Multicall3-eligible (see
 * `isMulticall3Eligible` in `useMulticall3Execution.ts`). The wrapped entries
 * render below this header in the parent component when `isExpanded` is true.
 */
export const MulticallBatchHeader = ({
  transactions,
  isExpanded,
  onToggle,
  isExecuting,
}: MulticallBatchHeaderProps) => {
  const count = transactions.length

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 sm:p-4 bg-aqua/10 border-b border-aqua/30 hover:bg-aqua/15 transition-colors text-left"
      aria-expanded={isExpanded}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-aqua/20 border border-aqua/40 flex-shrink-0 rounded-inset">
          <Icon name="shield" className="w-4 h-4 sm:w-5 sm:h-5 text-aqua" />
        </div>
        <div className="min-w-0">
          <h4 className="font-oracle-standard text-xs sm:text-sm font-bold uppercase tracking-wide text-aqua">
            Multicall3 batch — {count} transaction{count !== 1 ? 's' : ''}
          </h4>
          <p className="text-[10px] sm:text-xs text-parchment/60 mt-0.5">
            One wallet signature. All {count} run atomically — if any reverts, none apply.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isExecuting && (
          <div className="w-3 h-3 sm:w-4 sm:h-4 border border-aqua/30 border-t-aqua rounded-full animate-spin" />
        )}
        <Icon
          name="chevronDown"
          size="md"
          className={`text-aqua transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
  )
}
