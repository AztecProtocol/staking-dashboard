import { useEffect, useRef } from "react"
import type { Address } from "viem"
import { useWalletInitiateWithdraw, useFinalizeWithdraw, SequencerStatus } from "@/hooks/rollup"
import { TooltipIcon } from "@/components/Tooltip"
import { useAlert } from "@/contexts/AlertContext"
import { getUnlockTimeDisplay } from "@/utils/dateFormatters"

/**
 * Parse contract errors to extract user-friendly messages
 */
function parseContractError(error: Error): string {
  const message = error.message || ""

  const errorMappings: Record<string, string> = {
    "Staking__NotExiting": "Sequencer is not in exiting state. Initiate unstake first.",
    "Staking__ExitDelayNotPassed": "Exit delay has not passed yet. Please wait for the withdrawal period to complete.",
    "Staking__WithdrawalDelayNotPassed": "Withdrawal delay has not passed yet. Please wait for the withdrawal period to complete.",
    "Staking__NotTheWithdrawer": "You are not the withdrawer for this stake. Only the original staker can initiate withdrawal.",
    "NotExiting": "Sequencer is not in exiting state.",
    "ExitDelayNotPassed": "Exit delay has not passed yet.",
    "NotTheWithdrawer": "Only the withdrawer can initiate withdrawal.",
    "0xef566ee0": "Exit delay has not passed yet. Please wait for the withdrawal period to complete.",
  }

  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (message.includes(pattern)) {
      return friendlyMessage
    }
  }

  const revertMatch = message.match(/reverted with.*?["']([^"']+)["']/i)
  if (revertMatch) {
    return revertMatch[1]
  }

  const customErrorMatch = message.match(/error=\{[^}]*"data":"(0x[a-f0-9]+)"/i)
  if (customErrorMatch) {
    const errorData = customErrorMatch[1]
    for (const [selector, friendlyMessage] of Object.entries(errorMappings)) {
      if (errorData.startsWith(selector)) {
        return friendlyMessage
      }
    }
  }

  if (message.includes("nonce") && message.includes("0x")) {
    const selectorMatch = message.match(/0x[a-f0-9]{8}/i)
    if (selectorMatch) {
      const selector = selectorMatch[0].toLowerCase()
      if (selector === "0xef566ee0") {
        return "Exit delay has not passed yet. Please wait for the withdrawal period to complete."
      }
    }
    return "Transaction failed. The contract rejected the call - please check that all conditions are met."
  }

  if (message.length > 200) {
    return message.substring(0, 200) + "..."
  }

  return message || "Transaction failed"
}

interface WalletWithdrawalActionsProps {
  attesterAddress: Address
  recipientAddress: Address
  status: number | undefined
  canFinalize: boolean
  actualUnlockTime?: bigint
  withdrawalDelayDays?: number
  onSuccess?: () => void
}

/**
 * Component for wallet stake withdrawal actions
 * Calls the Rollup contract directly for initiate and finalize withdraw
 */
export const WalletWithdrawalActions = ({
  attesterAddress,
  recipientAddress,
  status,
  canFinalize,
  actualUnlockTime,
  withdrawalDelayDays,
  onSuccess,
}: WalletWithdrawalActionsProps) => {
  const { showAlert } = useAlert()
  const isExiting = status === SequencerStatus.EXITING

  const {
    initiateWithdraw,
    isPending: isInitiatingWithdraw,
    isConfirming: isConfirmingInitiate,
    isSuccess: isInitiateSuccess,
    error: initiateError,
  } = useWalletInitiateWithdraw()

  const {
    finalizeWithdraw,
    isPending: isFinalizingWithdraw,
    isConfirming: isConfirmingFinalize,
    isSuccess: isFinalizeSuccess,
    error: finalizeError,
  } = useFinalizeWithdraw()

  const canInitiateUnstake =
    status === SequencerStatus.VALIDATING || status === SequencerStatus.ZOMBIE

  // Track if success callback was already fired to prevent duplicate calls
  const successCallbackFiredRef = useRef(false)

  // Reset the ref when success states reset (new transaction cycle)
  useEffect(() => {
    if (!isInitiateSuccess && !isFinalizeSuccess) {
      successCallbackFiredRef.current = false
    }
  }, [isInitiateSuccess, isFinalizeSuccess])

  useEffect(() => {
    if (initiateError) {
      const errorMessage = initiateError.message
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        showAlert("warning", "Transaction was cancelled")
      }
    }
  }, [initiateError, showAlert])

  useEffect(() => {
    if (finalizeError) {
      const errorMessage = finalizeError.message
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        showAlert("warning", "Transaction was cancelled")
      }
    }
  }, [finalizeError, showAlert])

  useEffect(() => {
    if ((isInitiateSuccess || isFinalizeSuccess) && !successCallbackFiredRef.current) {
      successCallbackFiredRef.current = true
      onSuccess?.()
    }
  }, [isInitiateSuccess, isFinalizeSuccess, onSuccess])

  const handleInitiateWithdraw = async () => {
    try {
      await initiateWithdraw(attesterAddress, recipientAddress)
    } catch (error) {
      console.error("Failed to initiate withdraw:", error)
    }
  }

  const handleFinalizeWithdraw = async () => {
    try {
      await finalizeWithdraw(attesterAddress)
    } catch (error) {
      console.error("Failed to finalize withdraw:", error)
    }
  }

  return (
    <div className="pt-3 border-t border-parchment/10 space-y-2">
      <div className="flex items-center gap-1">
        <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
          Withdrawal Actions
        </div>
        <TooltipIcon
          content="To unstake, first initiate the unstake process. After the withdrawal period completes, you can finalize to receive your funds back to your wallet."
          size="sm"
          maxWidth="max-w-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <button
            onClick={handleInitiateWithdraw}
            disabled={
              !canInitiateUnstake ||
              isInitiatingWithdraw ||
              isConfirmingInitiate
            }
            className="w-full bg-aqua text-ink py-1.5 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-aqua/90 transition-all disabled:opacity-50 disabled:hover:bg-aqua"
          >
            {isInitiatingWithdraw
              ? "Confirming..."
              : isConfirmingInitiate
                ? "Initiating..."
                : "Initiate Unstake"}
          </button>
          <div className="flex items-center gap-1 mt-1">
            <TooltipIcon
              content="Starts the unstaking process. Only available when sequencer is Validating or Inactive. This begins the withdrawal waiting period."
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
            onClick={handleFinalizeWithdraw}
            disabled={
              !canFinalize || isFinalizingWithdraw || isConfirmingFinalize
            }
            className="w-full bg-chartreuse text-ink py-1.5 px-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:hover:bg-chartreuse"
          >
            {isFinalizingWithdraw
              ? "Confirming..."
              : isConfirmingFinalize
                ? "Finalizing..."
                : "Finalize Withdraw"}
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

      {initiateError &&
        !(
          initiateError.message.includes("User rejected") ||
          initiateError.message.includes("rejected")
        ) && (
          <div className="bg-vermillion/10 border border-vermillion/20 p-3 rounded">
            <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">
              Transaction Error
            </div>
            <div className="text-xs text-parchment/80">
              {parseContractError(initiateError)}
            </div>
          </div>
        )}

      {finalizeError &&
        !(
          finalizeError.message.includes("User rejected") ||
          finalizeError.message.includes("rejected")
        ) && (
          <div className="bg-vermillion/10 border border-vermillion/20 p-3 rounded">
            <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">
              Transaction Error
            </div>
            <div className="text-xs text-parchment/80">
              {parseContractError(finalizeError)}
            </div>
          </div>
        )}

      {(isInitiateSuccess || isFinalizeSuccess) && (
        <div className="bg-chartreuse/10 border border-chartreuse/20 p-3 rounded">
          <div className="text-xs font-oracle-standard font-bold text-chartreuse uppercase tracking-wide">
            {isInitiateSuccess ? "Unstake Initiated" : "Withdrawal Finalized"}
          </div>
        </div>
      )}
    </div>
  )
}
