import { Icon } from "@/components/Icon"

interface ProviderPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * Pagination component for provider table
 */
export const ProviderPagination = ({
  currentPage,
  totalPages,
  onPageChange
}: ProviderPaginationProps) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-parchment/20 text-parchment hover:bg-parchment/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="chevronLeft" size="md" />
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 font-oracle-standard text-xs uppercase tracking-wide transition-colors ${
              currentPage === page
                ? 'bg-chartreuse text-ink'
                : 'border border-parchment/20 text-parchment hover:bg-parchment/5'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border border-parchment/20 text-parchment hover:bg-parchment/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="chevronRight" size="md" />
      </button>
    </div>
  )
}
