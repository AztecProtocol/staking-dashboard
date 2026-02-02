import { CopyButton } from "@/components/CopyButton"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import { getExplorerAddressUrl } from "@/utils/explorerUtils"
import type { ATPData } from "@/hooks/atp"

interface ATPDetailsHeaderProps {
  atp: ATPData
  onClose: () => void
}

/**
 * Header component for ATP Details Modal
 * Displays ATP title, address with copy/explorer functionality, and close button
 */
export const ATPDetailsHeader = ({ atp, onClose }: ATPDetailsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-arizona-serif text-2xl font-light leading-100 tracking-tight-5 text-parchment">
            Token Vault #{atp.sequentialNumber || '?'} <em className="italic">Details</em>
          </h1>
          <TooltipIcon
            content="Detailed view of your Token Vault including staking breakdown, delegations, vesting schedule, and technical information."
            size="sm"
            maxWidth="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-sm text-parchment/60">
            {atp.atpAddress.slice(0, 8)}...{atp.atpAddress.slice(-6)}
          </span>
          <CopyButton text={atp.atpAddress} size="sm" className="p-1" />
          <a
            href={getExplorerAddressUrl(atp.atpAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-parchment/60 hover:text-chartreuse transition-colors p-1"
            title="View on Etherscan"
          >
            <Icon name="externalLink" size="md" />
          </a>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-parchment/60 hover:text-parchment transition-colors p-2"
        aria-label="Close modal"
      >
        <Icon name="x" size="lg" />
      </button>
    </div>
  )
}