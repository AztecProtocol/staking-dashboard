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
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
          Search Provider
        </h4>
        <TooltipIcon
          content="Search for specific providers by name or wallet address. This helps you quickly find and compare providers you're interested in."
          size="sm"
          maxWidth="max-w-sm"
        />
      </div>
      <div className="bg-parchment/5 border border-parchment/20 focus-within:border-chartreuse focus-within:bg-chartreuse/5 transition-colors">
        <div className="flex items-center p-4">
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