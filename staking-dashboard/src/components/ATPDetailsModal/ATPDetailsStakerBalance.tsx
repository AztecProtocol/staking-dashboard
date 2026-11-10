import { useAccount } from "wagmi"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useStakerBalance } from "@/hooks/staker"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { type ATPData } from "@/hooks"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { buildMoveFundsBackToATPEntry } from "@/utils/actionCart"

interface ATPDetailsStakerBalanceProps {
  atp: ATPData
}

/**
 * Displays staker contract balance and a button to queue a move-funds-back-to-ATP
 * transaction in the cart. Only the operator can submit it on-chain.
 *
 * Compact inline layout.
 */
export const ATPDetailsStakerBalance = ({ atp }: ATPDetailsStakerBalanceProps) => {
  const { address: connectedAddress } = useAccount()
  const { balance, isLoading: isLoadingBalance } = useStakerBalance({ stakerAddress: atp.staker })
  const { symbol, decimals, isLoading: isLoadingTokenDetails } = useStakingAssetTokenDetails()
  const { addTransaction, checkStepGroupInQueue, openCart } = useTransactionCart()

  const isLoading = isLoadingBalance || isLoadingTokenDetails
  const hasBalance = balance > 0n
  const isOperator = connectedAddress?.toLowerCase() === atp.operator?.toLowerCase()

  const entry = atp.staker
    ? buildMoveFundsBackToATPEntry({ stakerAddress: atp.staker, atpAddress: atp.atpAddress })
    : undefined

  const isQueued = !!entry && !!entry.metadata?.stepType && !!entry.metadata?.stepGroupIdentifier &&
    checkStepGroupInQueue(entry.metadata.stepType, entry.metadata.stepGroupIdentifier)

  const handleAddToBatch = () => {
    if (!entry) return
    addTransaction(entry, { preventDuplicate: true })
    openCart()
  }

  return (
    <div className="glass p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-xs text-parchment/60 uppercase tracking-wide">
          Staker Balance
        </div>
        <TooltipIcon
          content="Tokens in the staker contract from claimed staking rewards. Failed deposits are automatically sent back here. Move these funds back to your Token Vault to claim or re-stake."
          size="sm"
          maxWidth="max-w-xs"
        />
        <div className="font-mono text-sm font-bold text-parchment ml-2">
          {isLoading ? "Loading..." : formatTokenAmount(balance, decimals, symbol)}
        </div>
      </div>
      {hasBalance && (
        <div className="flex items-center gap-2">
          {isQueued ? (
            <button
              onClick={openCart}
              disabled={!isOperator}
              className="px-3 py-1.5 bg-parchment/10 border border-parchment/20 text-accent font-oracle-standard text-xs uppercase tracking-wider hover:bg-parchment/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 rounded-btn"
            >
              <Icon name="shoppingCart" size="sm" />
              In Batch
            </button>
          ) : (
            <button
              onClick={handleAddToBatch}
              disabled={!isOperator || !entry}
              className="px-3 py-1.5 btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Batch
            </button>
          )}
          {!isOperator && (
            <TooltipIcon
              content="Only the operator can move funds to vault"
              size="sm"
              maxWidth="max-w-xs"
            />
          )}
        </div>
      )}
    </div>
  )
}
