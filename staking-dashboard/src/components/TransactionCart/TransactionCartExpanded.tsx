import { useState } from "react"
import { Icon } from "@/components/Icon"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { useTermsModal } from "@/contexts/TermsModalContext"
import { TransactionCartDetailsExpanded } from "./TransactionCartDetailsExpanded"

interface TransactionCartExpandedProps {
  onMinimize: () => void
}

/**
 * Expanded view of the transaction cart
 * Shows all transactions with actions to execute, clear, and reorder
 */
export const TransactionCartExpanded = ({ onMinimize }: TransactionCartExpandedProps) => {
  const {
    transactions,
    removeTransaction,
    clearCart,
    executeAll,
    isExecuting,
    currentExecutingId,
    moveUp,
    moveDown
  } = useTransactionCart()

  const { requireTermsAcceptance } = useTermsModal()

  const [expandedTxId, setExpandedTxId] = useState<string | null>(null)

  const toggleExpand = (txId: string) => {
    setExpandedTxId(expandedTxId === txId ? null : txId)
  }

  const handleExecuteClick = () => {
    requireTermsAcceptance(executeAll)
  }

  const pendingCount = transactions.filter(tx => tx.status === 'pending' || tx.status === undefined).length

  return (
    <div className="overflow-hidden">
      {/* Cart Header */}
      <div className="flex items-center justify-between p-4 border-b border-parchment/20">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-chartreuse/20 border border-chartreuse flex items-center justify-center">
            <Icon name="shoppingCart" className="w-5 h-5 text-chartreuse" />
          </div>
          <div>
            <h3 className="font-oracle-standard text-sm font-bold uppercase tracking-wide text-parchment">
              Transaction Queue
            </h3>
            <p className="text-xs text-parchment/60">
              {pendingCount} transaction{pendingCount !== 1 ? 's' : ''} pending
            </p>
          </div>
        </div>

        <button
          onClick={onMinimize}
          className="p-2 text-parchment/60 hover:text-parchment transition-colors"
          title="Minimize"
        >
          <Icon name="chevronDown" size="sm" />
        </button>
      </div>

      {/* Order Warning */}
      {transactions.length > 0 && (
        <div className="p-3 border-b border-parchment/20 bg-aqua/5">
          <div className="flex items-center gap-2">
            <Icon name="info" size="sm" className="text-aqua" />
            <p className="text-[10px] sm:text-xs text-parchment/80 leading-relaxed">
              Transactions will execute in the order shown. Use the arrow buttons to reorder if needed.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border-b border-parchment/20 bg-parchment/5">
        <button
          onClick={handleExecuteClick}
          disabled={isExecuting || pendingCount === 0}
          className={`flex-1 px-4 py-2 font-oracle-standard text-xs sm:text-sm font-bold uppercase tracking-wide transition-all ${isExecuting || pendingCount === 0
              ? 'bg-parchment/20 text-parchment/40 cursor-not-allowed'
              : 'bg-chartreuse text-ink hover:bg-chartreuse/90'
            }`}
        >
          {isExecuting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Executing...</span>
              <span className="sm:hidden">Executing</span>
            </div>
          ) : (
            <>
              {(() => {
                const hasCompleted = transactions.some(tx => tx.status === 'completed')
                const hasPending = pendingCount > 0
                const buttonText = hasCompleted && hasPending ? 'Resume' : 'Execute All'

                return (
                  <>
                    <span className="hidden sm:inline">{buttonText} ({pendingCount})</span>
                    <span className="sm:hidden">{hasCompleted && hasPending ? 'Resume' : 'Execute'} ({pendingCount})</span>
                  </>
                )
              })()}
            </>
          )}
        </button>

        <button
          onClick={clearCart}
          disabled={isExecuting || transactions.length === 0}
          className="sm:p-2 py-2 px-4 sm:px-2 text-parchment/60 hover:text-vermillion transition-colors disabled:opacity-40 border border-parchment/30 sm:border-0"
          title="Clear all transactions"
        >
          <span className="flex items-center justify-center gap-2 sm:gap-0">
            <Icon name="trash2" size="sm" />
            <span className="sm:hidden text-xs font-oracle-standard uppercase">Clear All</span>
          </span>
        </button>
      </div>

      {/* Cart Items */}
      <div className="max-h-60 sm:max-h-80 overflow-y-auto custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-parchment/60 text-sm">No transactions in queue</p>
            <p className="text-parchment/40 text-xs mt-2">Add delegations or claims to batch execute them</p>
          </div>
        ) :
          transactions.map((tx, index) => {
            const isCurrentlyExecuting = currentExecutingId === tx.id
            const isPending = isExecuting && !isCurrentlyExecuting
            const canMoveUp = index > 0 && !isExecuting
            const canMoveDown = index < transactions.length - 1 && !isExecuting
            const isExpanded = expandedTxId === tx.id

            return (
              <div
                key={tx.id}
                className={`border-b border-parchment/10 last:border-b-0 transition-all ${isCurrentlyExecuting
                    ? 'bg-chartreuse/10 border-l-4 border-l-chartreuse'
                    : isPending
                      ? 'bg-parchment/5 opacity-50'
                      : 'hover:bg-parchment/5'
                  }`}
              >
                <div className="flex items-center gap-2 p-3 sm:p-4">
                  {/* Reorder Controls */}
                  <div className="hidden sm:flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveUp(tx.id)}
                      disabled={!canMoveUp}
                      className="p-1 text-parchment/40 hover:text-parchment disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <Icon name="chevronUp" size="sm" />
                    </button>
                    <button
                      onClick={() => moveDown(tx.id)}
                      disabled={!canMoveDown}
                      className="p-1 text-parchment/40 hover:text-parchment disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <Icon name="chevronDown" size="sm" />
                    </button>
                  </div>

                  {/* Order Number */}
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border border-parchment/30 text-parchment/60 font-oracle-standard text-[10px] sm:text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-oracle-standard text-xs sm:text-sm font-bold text-parchment truncate">
                        {tx.label}
                      </h4>
                      {/* Status Badge - Even Smaller */}
                      {tx.status && (
                        <div className={`px-1 py-0.5 border text-[9px] font-oracle-standard uppercase tracking-wide whitespace-nowrap ${
                          tx.status === 'completed' ? 'bg-chartreuse/10 border-chartreuse/30 text-chartreuse' :
                          tx.status === 'failed' ? 'bg-vermillion/10 border-vermillion/30 text-vermillion' :
                          tx.status === 'executing' ? 'bg-aqua/10 border-aqua/30 text-aqua' :
                          'bg-parchment/10 border-parchment/30 text-parchment/60'
                        }`}>
                          {tx.status}
                        </div>
                      )}
                      {isCurrentlyExecuting && (
                        <div className="flex items-center gap-1.5 text-chartreuse text-xs">
                          <div className="w-3 h-3 border border-chartreuse/30 border-t-chartreuse rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Executing</span>
                        </div>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-[10px] sm:text-xs text-parchment/60 mt-1 truncate">{tx.description}</p>
                    )}
                  </div>

                  {/* Transaction Type Badge */}
                  <div className="hidden md:flex items-center px-2 py-1 bg-parchment/10 border border-parchment/20 flex-shrink-0">
                    <span className="text-[10px] text-parchment/70 font-oracle-standard uppercase tracking-wide whitespace-nowrap">
                      {tx.type.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleExpand(tx.id)}
                    disabled={isExecuting}
                    className="flex items-center gap-1 px-2 py-1 border border-parchment/30 text-parchment/60 hover:text-parchment hover:border-parchment/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    title={isExpanded ? "Hide details" : "Show details"}
                  >
                    <span className="text-[10px] font-oracle-standard uppercase tracking-wide">Details</span>
                    <Icon name={isExpanded ? "chevronUp" : "chevronDown"} size="sm" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeTransaction(tx.id)}
                    disabled={isExecuting}
                    className="p-1.5 sm:p-2 text-parchment/40 hover:text-vermillion transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    title="Remove from queue"
                  >
                    <Icon name="x" size="sm" />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && <TransactionCartDetailsExpanded transaction={tx} />}
              </div>
            )
          })}
      </div>
    </div>
  )
}
