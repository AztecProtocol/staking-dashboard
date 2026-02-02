/**
 * Skeleton loading state for ATPStakingOverview
 */
export const ATPStakingOverviewSkeleton = () => {
  return (
    <div className="bg-parchment/5 border border-parchment/20 p-8">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-6 h-6 flex-shrink-0 bg-parchment/20 animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-parchment/20 animate-pulse mb-2" />
          <div className="h-4 w-96 bg-parchment/20 animate-pulse" />
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Staked Card Skeleton */}
          <div className="border-2 border-parchment/40 p-4">
            <div className="h-3 w-24 bg-parchment/20 animate-pulse mb-2" />
            <div className="h-6 w-40 bg-parchment/20 animate-pulse" />
          </div>

          {/* Stakeable Amount Card Skeleton */}
          <div className="border-2 border-parchment/40 p-4">
            <div className="h-3 w-32 bg-parchment/20 animate-pulse mb-2" />
            <div className="h-6 w-40 bg-parchment/20 animate-pulse" />
          </div>

          {/* Claimable Rewards Card Skeleton */}
          <div className="bg-chartreuse/5 border-2 border-chartreuse/40 p-4">
            <div className="h-3 w-32 bg-parchment/20 animate-pulse mb-2" />
            <div className="h-8 w-48 bg-parchment/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
