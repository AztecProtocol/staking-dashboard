import { Icon } from "@/components/Icon"

interface ATPDetailsErrorStateProps {
  onClose: () => void
}

/**
 * Error state component for ATP Details Modal
 * Displays error message and retry functionality when API fails
 */
export const ATPDetailsErrorState = ({ onClose }: ATPDetailsErrorStateProps) => {
  return (
    <div
      className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-16"
      onClick={onClose}
    >
      <div className="bg-ink border border-parchment/20 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-arizona-serif text-xl text-parchment">Error Loading Details</h2>
            <button
              onClick={onClose}
              className="text-parchment/60 hover:text-parchment transition-colors p-2"
              aria-label="Close modal"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>
          <p className="text-parchment/70 mb-4">Failed to load ATP details. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-chartreuse text-ink px-4 py-2 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}