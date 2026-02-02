/**
 * Loading skeleton for provider detail page that matches the actual layout
 */
export const ProviderDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* PageHeader Skeleton */}
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-parchment/20 rounded w-48 mb-2"></div>
          <div className="h-4 bg-parchment/10 rounded w-64"></div>
        </div>
      </div>

      {/* OperatorOverview Skeleton */}
      <div className="bg-parchment/5 border border-parchment/20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-parchment/20 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-parchment/20 rounded w-32"></div>
              <div className="h-4 bg-parchment/10 rounded w-24"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-parchment/10 rounded w-20"></div>
                <div className="h-5 bg-parchment/20 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - OperatorInfo Skeleton */}
        <div className="bg-parchment/5 border border-parchment/20 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-parchment/20 rounded w-32"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-parchment/10 rounded w-24"></div>
                  <div className="h-4 bg-parchment/20 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - OperatorStakingFlow Skeleton */}
        <div className="bg-parchment/5 border border-parchment/20 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-parchment/20 rounded w-40"></div>
            <div className="space-y-4">
              <div className="h-4 bg-parchment/10 rounded w-full"></div>
              <div className="h-4 bg-parchment/10 rounded w-3/4"></div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-parchment/20 rounded w-full"></div>
              <div className="h-10 bg-parchment/20 rounded w-full"></div>
            </div>
            <div className="h-12 bg-chartreuse/20 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}