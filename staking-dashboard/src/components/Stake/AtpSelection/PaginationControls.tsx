interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  onPrevPage: () => void
  onNextPage: () => void
  onPageSelect: (page: number) => void
  getVisiblePages: () => (number | string)[]
}

/**
 * Pagination controls component for ATP selection
 * Handles both desktop and mobile pagination layouts
 */
export const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPrevPage,
  onNextPage,
  onPageSelect,
  getVisiblePages
}: PaginationControlsProps) => {
  if (totalPages <= 1) return null

  return (
    <div className="space-y-4">
      <div className="bg-parchment/5 border border-parchment/20 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-parchment/60">
          <span>
            Select one to proceed to the next step.
          </span>
          <span className="text-right">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
          </span>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="w-full overflow-hidden">
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-oracle-standard font-bold uppercase tracking-wider bg-parchment/10 text-parchment border-2 border-parchment/30 hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Desktop: Show all pages */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageSelect(page)}
                className={`px-3 py-2 text-xs font-oracle-standard font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                  currentPage === page
                    ? 'bg-chartreuse text-ink border-2 border-chartreuse'
                    : 'bg-parchment/10 text-parchment border-2 border-parchment/30 hover:bg-parchment/20 hover:border-parchment/50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Mobile: Show limited pages (current +/- 1) */}
          <div className="flex sm:hidden items-center gap-1 mx-2 flex-1 justify-center min-w-0">
            {getVisiblePages().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 py-1.5 text-xs text-parchment/60 flex-shrink-0">
                    ...
                  </span>
                )
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageSelect(page as number)}
                  className={`px-2 py-1.5 text-xs font-oracle-standard font-bold uppercase tracking-wider transition-all min-w-[32px] flex-shrink-0 ${
                    currentPage === page
                      ? 'bg-chartreuse text-ink border-2 border-chartreuse'
                      : 'bg-parchment/10 text-parchment border-2 border-parchment/30 hover:bg-parchment/20 hover:border-parchment/50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-oracle-standard font-bold uppercase tracking-wider bg-parchment/10 text-parchment border-2 border-parchment/30 hover:bg-parchment/20 hover:border-parchment/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
          </button>
        </div>
      </div>
    </div>
  )
}