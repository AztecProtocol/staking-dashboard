import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"

interface ProviderSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

/**
 * Search component for filtering providers by name or address
 */
export const ProviderSearch = ({ searchQuery, onSearchChange }: ProviderSearchProps) => {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="eyebrow text-parchment/70">
          Search Provider
        </h4>
        <TooltipIcon
          content="Search for specific providers by name or wallet address. This helps you quickly find and compare providers you're interested in."
          size="sm"
          maxWidth="max-w-sm"
        />
      </div>
      <div className="field">
        <div className="flex items-center px-4 py-3.5">
          <Icon name="search" size="lg" className="text-parchment/50 mr-3" />
          <input
            type="text"
            className="flex-1 bg-transparent font-oracle-triple border-none text-parchment outline-none placeholder-parchment/50 text-sm"
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}