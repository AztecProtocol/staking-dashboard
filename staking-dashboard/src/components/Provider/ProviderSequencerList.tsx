import { useState, useMemo } from "react"
import { CopyButton } from "@/components/CopyButton"
import { Icon } from "@/components/Icon"
import { openAddressInExplorer, openTxInExplorer } from "@/utils/explorerUtils"
import { formatBlockTimestamp } from "@/utils/dateFormatters"
import { getValidatorDashboardValidatorUrl } from "@/utils/validatorDashboardUtils"
import { Pagination } from "@/components/Pagination"

interface Stake {
  atpAddress: string
  stakerAddress: string
  splitContractAddress: string
  rollupAddress: string
  attesterAddress: string
  stakedAmount: string
  blockNumber: string
  txHash: string
  timestamp: string
  atp: any
}

interface ProviderSequencerListProps {
  stakes: Stake[]
}

/**
 * Component for displaying all stakes associated with a provider
 * Shows sequencer addresses and split contracts in a table format
 */
export const ProviderSequencerList = ({ stakes }: ProviderSequencerListProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Filter and sort stakes based on search query and timestamp
  const filteredStakes = useMemo(() => {
    let result = stakes

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (stake) =>
          stake.attesterAddress.toLowerCase().includes(query) ||
          stake.splitContractAddress.toLowerCase().includes(query)
      )
    }

    // Sort by timestamp descending (newest first)
    return result.sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime()
      const timestampB = new Date(b.timestamp).getTime()
      return timestampB - timestampA
    })
  }, [stakes, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredStakes.length / itemsPerPage)
  const paginatedStakes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredStakes.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredStakes, currentPage])

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  if (!stakes || stakes.length === 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
          Sequencer Registered
        </h4>
        <div className="text-sm text-parchment/50 italic">No sequencer registered found</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-parchment/5 border border-parchment/20 hover:bg-parchment/10 transition-colors"
      >
        <h4 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
          Sequencer Registered ({stakes.length})
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-parchment/60">
            {isExpanded ? 'Hide' : 'Show'}
          </span>
          <Icon
            name="chevronDown"
            size="md"
            className={`text-parchment transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by sequencer or split contract address..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 bg-parchment/5 border border-parchment/20 text-parchment placeholder-parchment/40 font-mono text-sm focus:outline-none focus:border-chartreuse/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment/60 hover:text-parchment transition-colors"
              >
                <Icon name="x" size="sm" />
              </button>
            )}
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="text-xs text-parchment/60">
              Found {filteredStakes.length} of {stakes.length} stakes
            </div>
          )}

          {filteredStakes.length === 0 ? (
            <div className="text-sm text-parchment/50 italic py-4">
              No stakes match your search
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-parchment/20">
                      <th className="text-left text-xs text-parchment/60 uppercase tracking-wide pb-2 pr-6 whitespace-nowrap">Sequencer Address</th>
                      <th className="text-left text-xs text-parchment/60 uppercase tracking-wide pb-2 pr-6 whitespace-nowrap">Split Contract</th>
                      <th className="text-left text-xs text-parchment/60 uppercase tracking-wide pb-2 pr-6 whitespace-nowrap">TX Hash</th>
                      <th className="text-left text-xs text-parchment/60 uppercase tracking-wide pb-2 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStakes.map((stake, index) => {
                      const { date: dateStr, time: timeStr } = formatBlockTimestamp(stake.timestamp)

                      return (
                        <tr
                          key={`${stake.atpAddress}-${stake.attesterAddress}-${index}`}
                          className="border-b border-parchment/10 last:border-b-0"
                        >
                          {/* Sequencer Address */}
                          <td className="py-2 pr-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-parchment">
                                {stake.attesterAddress.slice(0, 6)}...{stake.attesterAddress.slice(-4)}
                              </span>
                              <CopyButton text={stake.attesterAddress} size="sm" className="flex-shrink-0" />
                              <a
                                href={getValidatorDashboardValidatorUrl(stake.attesterAddress)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-parchment/60 hover:text-chartreuse transition-colors flex-shrink-0"
                                title="View in validator dashboard"
                              >
                                <Icon name="externalLink" size="sm" />
                              </a>
                            </div>
                          </td>

                          {/* Split Contract */}
                          <td className="py-2 pr-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-parchment">
                                {stake.splitContractAddress.slice(0, 6)}...{stake.splitContractAddress.slice(-4)}
                              </span>
                              <CopyButton text={stake.splitContractAddress} size="sm" className="flex-shrink-0" />
                              <button
                                onClick={() => openAddressInExplorer(stake.splitContractAddress)}
                                className="text-parchment/60 hover:text-chartreuse transition-colors flex-shrink-0"
                                title="View in explorer"
                              >
                                <Icon name="externalLink" size="sm" />
                              </button>
                            </div>
                          </td>

                          {/* TX Hash */}
                          <td className="py-2 pr-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-parchment">
                                {stake.txHash.slice(0, 6)}...{stake.txHash.slice(-4)}
                              </span>
                              <CopyButton text={stake.txHash} size="sm" className="flex-shrink-0" />
                              <button
                                onClick={() => openTxInExplorer(stake.txHash)}
                                className="text-parchment/60 hover:text-chartreuse transition-colors flex-shrink-0"
                                title="View transaction in explorer"
                              >
                                <Icon name="externalLink" size="sm" />
                              </button>
                            </div>
                          </td>

                          {/* Date/Time */}
                          <td className="py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Icon name="clock" size="sm" className="text-parchment/60 flex-shrink-0" />
                              <div className="flex flex-col text-xs text-parchment">
                                <span>{dateStr}</span>
                                <span className="text-parchment/60">{timeStr}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStakes.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
