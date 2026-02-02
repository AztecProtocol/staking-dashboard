import { useEffect } from "react"
import { useAccount } from "wagmi"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useStakerBalance, useMoveFundsBackToATP } from "@/hooks/staker"
import { TooltipIcon } from "@/components/Tooltip"
import { useStakeableAmount, type ATPData } from "@/hooks"
import { useQueryClient } from "@tanstack/react-query"

interface ATPDetailsStakerBalanceProps {
  atp: ATPData
}

/**
 * Displays staker contract balance and provides button to move funds back to ATP
 * Only the operator can move funds back to vault
 * Compact inline layout
 */
export const ATPDetailsStakerBalance = ({ atp }: ATPDetailsStakerBalanceProps) => {
  const { address: connectedAddress } = useAccount()
  const { balance, isLoading: isLoadingBalance, refetch } = useStakerBalance({ stakerAddress: atp.staker })
  const { symbol, decimals, isLoading: isLoadingTokenDetails } = useStakingAssetTokenDetails()
  const { moveFunds, isPending, isConfirming, isSuccess } = useMoveFundsBackToATP(atp.staker!)
  const { refetch: refetchStakeableAmount } = useStakeableAmount(atp)
  const queryClient = useQueryClient()

  const isLoading = isLoadingBalance || isLoadingTokenDetails
  const isProcessing = isPending || isConfirming
  const hasBalance = balance > 0n
  const isOperator = connectedAddress?.toLowerCase() === atp.operator?.toLowerCase()

  // Refetch balance after successful move
  useEffect(() => {
    if (isSuccess) {
      refetch()
      refetchStakeableAmount()

      // Invalidate multiple stakeable amounts and refetch
      queryClient.invalidateQueries({
        queryKey: ['readContracts']
      })
    }
  }, [isSuccess, refetch])

  return (
    <div className="bg-parchment/5 border border-parchment/20 p-3 flex items-center justify-between">
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
          <button
            onClick={moveFunds}
            disabled={isProcessing || !isOperator}
            className="px-3 py-1.5 bg-chartreuse text-ink font-oracle-standard text-xs uppercase tracking-wider hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Moving...' : isConfirming ? 'Confirming...' : 'Move to Vault'}
          </button>
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
