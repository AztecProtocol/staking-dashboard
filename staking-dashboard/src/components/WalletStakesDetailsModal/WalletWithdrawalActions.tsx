import type { Address } from "viem"
import { SequencerStatus } from "@/hooks/rollup"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { getUnlockTimeDisplay } from "@/utils/dateFormatters"
import {
  buildRollupInitiateWithdrawEntry,
  buildRollupFinalizeWithdrawEntry,
} from "@/utils/unstakeCart"

interface WalletWithdrawalActionsProps {
  attesterAddress: Address
  recipientAddress: Address
  rollupAddress: Address
  status: number | undefined
  canFinalize: boolean
  actualUnlockTime?: bigint
  withdrawalDelayDays?: number
  onSuccess?: () => void
}

/**
 * Initiate / finalize unstake actions for the wallet/ERC20 direct-staker path.
 * Queues each as an `unstake` cart entry instead of firing immediately. Safe
 * wallets batch the whole cart into one proposal; EOA wallets sign each entry
 * sequentially (unstake is `msg.sender`-bound — Multicall3 can't batch these).
 */
export const WalletWithdrawalActions = ({
  attesterAddress,
  recipientAddress,
  rollupAddress,
  status,
  canFinalize,
  actualUnlockTime,
  withdrawalDelayDays,
  onSuccess,
}: WalletWithdrawalActionsProps) => {
  const isExiting = status === SequencerStatus.EXITING

  const { addTransaction, checkStepGroupInQueue, openCart } = useTransactionCart()

  const canInitiateUnstake =
    status === SequencerStatus.VALIDATING || status === SequencerStatus.ZOMBIE

  const initiateEntry = buildRollupInitiateWithdrawEntry({
    rollupAddress,
    attester: attesterAddress,
    recipient: recipientAddress,
  })
  const finalizeEntry = buildRollupFinalizeWithdrawEntry({
    rollupAddress,
    attester: attesterAddress,
  })
  // Queued-state check by stepGroupIdentifier (stable across data refetches)
  // rather than raw calldata signature (would flicker if the underlying
  // attester / rollup data changes mid-render and let the user double-queue).
  const isInitiateQueued = !!initiateEntry.metadata?.stepType
    && !!initiateEntry.metadata?.stepGroupIdentifier
    && checkStepGroupInQueue(initiateEntry.metadata.stepType, initiateEntry.metadata.stepGroupIdentifier)
  const isFinalizeQueued = !!finalizeEntry.metadata?.stepType
    && !!finalizeEntry.metadata?.stepGroupIdentifier
    && checkStepGroupInQueue(finalizeEntry.metadata.stepType, finalizeEntry.metadata.stepGroupIdentifier)

  const handleInitiateClick = () => {
    if (isInitiateQueued) {
      openCart()
      return
    }
    addTransaction(initiateEntry, { preventDuplicate: true })
    onSuccess?.()
    openCart()
  }

  const handleFinalizeClick = () => {
    if (isFinalizeQueued) {
      openCart()
      return
    }
    addTransaction(finalizeEntry, { preventDuplicate: true })
    onSuccess?.()
    openCart()
  }

  return (
    <div className="pt-3 border-t border-parchment/10 space-y-2">
      <div className="flex items-center gap-1">
        <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
          Withdrawal Actions
        </div>
        <TooltipIcon
          content="Queue the initiate / finalize unstake transactions in the batch cart. Safe wallets sign once for the whole batch; EOA wallets sign each entry sequentially."
          size="sm"
          maxWidth="max-w-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <button
            onClick={handleInitiateClick}
            disabled={!canInitiateUnstake && !isInitiateQueued}
            className={`w-full py-1.5 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
              isInitiateQueued
                ? "bg-aqua/20 border border-aqua/40 text-aqua hover:bg-aqua/30 rounded-btn"
                : "btn-glass"
            }`}
          >
            {isInitiateQueued ? (
              <span className="flex items-center justify-center gap-1.5">
                <Icon name="shoppingCart" size="sm" />
                In Batch — Open Cart
              </span>
            ) : (
              "Add Initiate Unstake"
            )}
          </button>
          <div className="flex items-center gap-1 mt-1">
            <TooltipIcon
              content="Starts the unstaking process. Only available when sequencer is Validating or Inactive."
              size="sm"
              maxWidth="max-w-xs"
            />
            <span className="text-[10px] text-parchment/50">
              Only available for Validating/Inactive status
            </span>
          </div>
        </div>
        <div className="flex-1">
          <button
            onClick={handleFinalizeClick}
            disabled={!canFinalize && !isFinalizeQueued}
            className={`w-full py-1.5 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
              isFinalizeQueued
                ? "bg-parchment/10 border border-parchment/20 text-accent hover:bg-parchment/15 rounded-btn"
                : "btn-lime"
            }`}
          >
            {isFinalizeQueued ? (
              <span className="flex items-center justify-center gap-1.5">
                <Icon name="shoppingCart" size="sm" />
                In Batch — Open Cart
              </span>
            ) : (
              "Add Finalize Withdraw"
            )}
          </button>
          <div className="flex items-center gap-1 mt-1">
            <TooltipIcon
              content="Completes the withdrawal and returns funds to your wallet. Only available after the withdrawal waiting period has passed."
              size="sm"
              maxWidth="max-w-xs"
            />
            <span className="text-[10px] text-parchment/50">
              {getUnlockTimeDisplay({ isExiting, actualUnlockTime, withdrawalDelayDays })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
