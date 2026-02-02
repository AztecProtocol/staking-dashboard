import { useState, useImperativeHandle, forwardRef } from "react"
import { useERC20TokenDetails } from "@/hooks/erc20/useERC20TokenDetails"
import { useStakeableAmount } from "@/hooks/atp/useStakeableAmount"
import { formatTokenAmountFull } from "@/utils/atpFormatters"
import { AddressDisplay } from "@/components/AddressDisplay/AddressDisplay"
import { type ATPData } from "@/hooks/atp/atpTypes"
import { useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"

interface StakeFlowSelectedAtpDetailsProps {
  selectedAtp: ATPData | null
  defaultExpanded?: boolean
  className?: string
}

export interface StakeFlowSelectedAtpDetailsRef {
  refetchStakeableAmount: () => Promise<void>
}

/**
 * Reusable component to display selected ATP details across registration steps
 * Features toggleable expansion and comprehensive ATP information
 */
export const StakeFlowSelectedAtpDetails = forwardRef<StakeFlowSelectedAtpDetailsRef, StakeFlowSelectedAtpDetailsProps>(({
  selectedAtp,
  defaultExpanded = false,
  className = ""
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { formData } = useATPStakingStepsContext()
  const { transactionType } = formData
  const { symbol, decimals, isLoading: isLoadingToken } = useERC20TokenDetails(selectedAtp?.token!)
  const { stakeableAmount, isLoading: isLoadingStakeable, refetch } = useStakeableAmount(selectedAtp)

  useImperativeHandle(ref, () => ({
    refetchStakeableAmount: async () => {
      await refetch()
    }
  }))

  if (!selectedAtp) {
    return null
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  return (
    <div className={`bg-parchment/5 border border-parchment/20 rounded ${className}`}>
      {/* Header - Always visible */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-parchment/10 transition-colors"
        onClick={toggleExpanded}
      >
        {/* Mobile layout: stacked vertically */}
        <div className="flex items-center justify-between sm:hidden">
          <div className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
            Selected Token Vault
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-parchment/60">
              {isExpanded ? 'Hide' : 'Show'}
            </div>
            <div className={`text-parchment/60 transition-transform text-xs ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </div>
        </div>

        {/* Desktop/tablet layout: horizontal */}
        <div className={`hidden sm:flex items-center justify-between`}>
          <div className="flex items-center gap-4 xl:gap-6 flex-1 min-w-0">
            <div className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide shrink-0">
              Selected Token Vault
            </div>

            {}
            <div className={`hidden ${transactionType == 'delegation' ? '' : 'xl:flex'} items-center gap-6 text-xs min-w-0`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-parchment/60 shrink-0">Total Funds:</span>
                <span className="text-parchment font-medium truncate">
                  {isLoadingToken ? (
                    'Loading...'
                  ) : selectedAtp.allocation ? (
                    formatTokenAmountFull(selectedAtp.allocation, decimals, symbol)
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-parchment/60 shrink-0">Available To Stake:</span>
                <span className="text-parchment font-medium truncate">
                  {isLoadingToken || isLoadingStakeable ? (
                    'Loading...'
                  ) : (
                    formatTokenAmountFull(stakeableAmount, decimals, symbol)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            <div className="text-xs text-parchment/60">
              {isExpanded ? 'Hide' : 'Show'}
            </div>
            <div className={`text-parchment/60 transition-transform text-xs ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-parchment/10">
          <div className="space-y-4 pt-4">
            {/* ATP Address */}
            <AddressDisplay
              address={selectedAtp.atpAddress}
              label="Vault Address"
              tooltip="The main Token Vault contract address"
              showExplorerLink={true}
            />

            {/* Total Funds and Available To Stake - close together */}
            <div className="space-y-3">
              {/* Total Funds */}
              <div>
                <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide mb-2">Total Funds</div>
                <div className="text-sm text-parchment">
                  {isLoadingToken ? (
                    'Loading...'
                  ) : selectedAtp.allocation ? (
                    formatTokenAmountFull(selectedAtp.allocation, decimals, symbol)
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>

              {/* Available To Stake */}
              <div>
                <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide mb-2">Available To Stake</div>
                <div className="text-sm text-parchment">
                  {isLoadingToken || isLoadingStakeable ? (
                    'Loading...'
                  ) : (
                    formatTokenAmountFull(stakeableAmount, decimals, symbol)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

StakeFlowSelectedAtpDetails.displayName = 'StakeFlowSelectedAtpDetails'