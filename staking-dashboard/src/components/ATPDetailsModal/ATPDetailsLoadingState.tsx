import { Icon } from "@/components/Icon"

interface ATPDetailsLoadingStateProps {
  onClose: () => void
}

/**
 * Loading state component for ATP Details Modal
 * Displays skeleton loading that mimics the actual modal structure
 */
export const ATPDetailsLoadingState = ({ onClose }: ATPDetailsLoadingStateProps) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-16"
      onClick={handleBackdropClick}
    >
      <div className="bg-ink border border-parchment/20 w-full max-w-4xl h-fit relative">
        <div className="p-6 relative z-10">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-8 w-48 bg-parchment/10 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-parchment/10 rounded animate-pulse"></div>
            </div>
            <button
              onClick={onClose}
              className="text-parchment/60 hover:text-parchment transition-colors p-2"
              aria-label="Close modal"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          {/* Summary Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-parchment/5 border border-parchment/20 p-4">
                <div className="h-3 w-16 bg-parchment/10 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-20 bg-parchment/10 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4">
            <div className="h-4 w-24 bg-parchment/10 rounded animate-pulse"></div>
            <div className="bg-parchment/5 border border-parchment/20 p-4">
              <div className="h-4 w-32 bg-parchment/10 rounded animate-pulse mb-3"></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-12 bg-parchment/10 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-16 bg-parchment/10 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}