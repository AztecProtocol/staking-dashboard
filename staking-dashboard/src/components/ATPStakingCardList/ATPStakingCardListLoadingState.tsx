import { ATPStakingOverviewSkeleton } from "@/components/ATPStakingOverview"

interface ATPStakingCardListLoadingStateProps {
  itemsPerPage: number
}

/**
 * Loading state component for ATPStakingCardList
 * Shows skeleton loading that mimics the ATP cards grid structure
 */
export const ATPStakingCardListLoadingState = ({ itemsPerPage }: ATPStakingCardListLoadingStateProps) => {
  return (
    <div className="space-y-6">
      {/* Skeleton for ATPStakingOverview */}
      <ATPStakingOverviewSkeleton />

      {/* Skeleton for ATP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(itemsPerPage)].map((_, index) => (
          <div key={index} className="bg-parchment/5 border border-parchment/20 p-4 sm:p-6">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-24 bg-parchment/10 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-parchment/10 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-32 bg-parchment/10 rounded animate-pulse"></div>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <div className="h-3 w-16 bg-parchment/10 rounded animate-pulse mb-1"></div>
                <div className="h-5 w-24 bg-parchment/10 rounded animate-pulse mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-11 w-20 bg-parchment/10 rounded animate-pulse"></div>
                  <div className="h-11 w-20 bg-parchment/10 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Lock status skeleton */}
            <div className="bg-parchment/8 border border-parchment/30 p-4 mb-6">
              <div className="h-4 w-48 bg-parchment/10 rounded animate-pulse"></div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-parchment/10 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-20 bg-parchment/10 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Address skeleton */}
            <div className="grid gap-4 pt-4 border-t border-parchment/10">
              <div className="h-3 w-20 bg-parchment/10 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-32 bg-parchment/10 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center pt-4 border-t border-parchment/10">
        <div className="h-10 w-48 bg-parchment/10 rounded animate-pulse"></div>
      </div>
    </div>
  )
}