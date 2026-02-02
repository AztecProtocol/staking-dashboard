import { Icon } from "@/components/Icon"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
  className?: string
}

/**
 * Reusable pagination component with Aztec design system styling
 * Provides navigation between pages with page numbers and prev/next buttons
 */
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className = ""
}: PaginationProps) => {
  if (totalPages <= 1) return null

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const delta = 1 // Number of pages to show around current page

    // Always show first page
    pages.push(1)

    // Calculate range around current page
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...')
    }

    // Add pages around current page
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('...')
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Items info */}
      <div className="text-sm text-parchment/60">
        Showing {startIndex} to {endIndex} of {totalItems}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`p-2 transition-all ${
            currentPage === 1
              ? "text-parchment/30 cursor-not-allowed"
              : "text-parchment/70 hover:text-parchment hover:bg-parchment/10"
          }`}
          aria-label="Previous page"
        >
          <Icon name="arrowLeft" size="lg" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-parchment/50">
                  ...
                </span>
              )
            }

            const pageNumber = page as number
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-1 text-sm font-oracle-standard transition-all ${
                  currentPage === pageNumber
                    ? "bg-chartreuse text-ink font-bold"
                    : "text-parchment/70 hover:text-parchment hover:bg-parchment/10"
                }`}
              >
                {pageNumber}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`p-2 transition-all ${
            currentPage === totalPages
              ? "text-parchment/30 cursor-not-allowed"
              : "text-parchment/70 hover:text-parchment hover:bg-parchment/10"
          }`}
          aria-label="Next page"
        >
          <Icon name="arrowRight" size="lg" />
        </button>
      </div>
    </div>
  )
}