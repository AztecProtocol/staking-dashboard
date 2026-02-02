import { formatAddress } from "@/utils/formatAddress"
import { TooltipIcon } from "@/components/Tooltip"
import { CopyButton } from "@/components/CopyButton"
import { Icon } from "@/components/Icon"
import { openAddressInExplorer } from "@/utils/explorerUtils"

interface AddressDisplayProps {
  address: string
  label: string
  tooltip?: string
  className?: string
  showExplorerLink?: boolean
}

/**
 * Reusable component for displaying addresses with copy functionality and explorer links
 * Prevents overflow and provides consistent UX across the app
 */
export const AddressDisplay = ({
  address,
  label,
  tooltip,
  className = "",
  showExplorerLink = true
}: AddressDisplayProps) => {

  const handleExplorerClick = () => {
    openAddressInExplorer(address)
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-1 mb-2">
        <div className="text-xs text-parchment/60 uppercase tracking-wide">{label}</div>
        {tooltip && (
          <TooltipIcon
            content={tooltip}
            size="sm"
            maxWidth="max-w-xs"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-parchment/80 truncate min-w-0">
          {formatAddress(address, 6, 4)}
        </span>
        <CopyButton text={address} size="md" />
        {showExplorerLink && (
          <button
            onClick={handleExplorerClick}
            className="p-1 text-parchment/60 hover:text-chartreuse transition-colors"
            title="View in explorer"
          >
            <Icon name="externalLink" size="md" />
          </button>
        )}
      </div>
    </div>
  )
}