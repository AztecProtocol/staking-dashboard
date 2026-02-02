import { useState } from "react"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { AddressDisplay } from "@/components/AddressDisplay"
import { useERC20TokenDetails } from "@/hooks/erc20/useERC20TokenDetails"
import { useStakeableAmount } from "@/hooks/atp/useStakeableAmount"
import { formatTokenAmount } from "@/utils/atpFormatters"
import type { ATPData } from "@/hooks/atp/atpTypes"

interface AtpCardProps {
  atp: ATPData
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}

/**
 * ATP card component for selection interface
 * Shows ATP details with expandable address information
 */
export const AtpCard = ({ atp, isSelected, onSelect, disabled = false }: AtpCardProps) => {
  const [showDetails, setShowDetails] = useState(false)
  const { symbol, decimals, isLoading } = useERC20TokenDetails(atp.token || atp.atpAddress)
  const { stakeableAmount, isStakeable, isLoading: isLoadingStakeable } = useStakeableAmount(atp)

  const totalAllocation = formatTokenAmount(atp.allocation, decimals, symbol)
  const formattedStakeable = formatTokenAmount(stakeableAmount, decimals, symbol)

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDetails(!showDetails)
  }

  const isClickable = isStakeable && !disabled

  return (
    <div
      className={`w-full border transition-all ${
        !isStakeable || disabled
          ? "bg-parchment/5 border-parchment/20 text-parchment/40 opacity-50 cursor-not-allowed"
          : isSelected
          ? "bg-chartreuse/5 border-chartreuse text-parchment"
          : "bg-parchment/5 border-parchment/20 hover:border-chartreuse/50 hover:bg-chartreuse/5 text-parchment cursor-pointer"
      }`}
      onClick={isClickable ? onSelect : undefined}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 text-xs font-md-thermochrome font-bold uppercase tracking-wider ${
            isStakeable
              ? "bg-parchment/20 text-parchment"
              : "bg-parchment/10 text-parchment/40"
          }`}>
            Token Vault #{atp.sequentialNumber || '?'}
          </div>
          {isSelected && (
            <div className="w-2 h-2 bg-chartreuse" />
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-parchment/60 uppercase tracking-wide">Total Funds</span>
            <div className="font-mono text-sm font-bold text-chartreuse">
              {isLoading ? "..." : totalAllocation}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-parchment/60 uppercase tracking-wide">Available To Stake</span>
            <div className="font-mono text-sm font-bold text-aqua">
              {isLoading || isLoadingStakeable ? "..." : formattedStakeable}
            </div>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="border-t border-parchment/20 px-4 py-3">
        <button
          onClick={handleToggleDetails}
          className="w-full flex items-center justify-center gap-1 text-xs text-parchment/60 hover:text-parchment transition-colors font-oracle-standard uppercase tracking-wider"
        >
          <span>{showDetails ? "Hide" : "Details"}</span>
          <Icon
            name="chevronDown"
            size="sm"
            className={`transition-transform ${showDetails ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="border-t border-parchment/20 p-4 space-y-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Vault</span>
              <TooltipIcon
                content="The smart contract address of this Token Vault."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
            <AddressDisplay
              address={atp.atpAddress}
              label=""
              showExplorerLink={true}
              className="flex items-center gap-1"
            />
          </div>

          {atp.beneficiary && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Owner</span>
                <TooltipIcon
                  content="The address that owns this Token Vault."
                  size="sm"
                  maxWidth="max-w-xs"
                />
              </div>
              <AddressDisplay
                address={atp.beneficiary}
                label=""
                showExplorerLink={true}
                className="flex items-center gap-1"
              />
            </div>
          )}

          {atp.staker && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">Staker</span>
                <TooltipIcon
                  content="The staker contract for this Token Vault."
                  size="sm"
                  maxWidth="max-w-xs"
                />
              </div>
              <AddressDisplay
                address={atp.staker}
                label=""
                showExplorerLink={true}
                className="flex items-center gap-1"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}