import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { useStakingSummary } from '@/hooks/staking/useStakingSummary'
import { useStakingAssetTokenDetails } from '@/hooks/stakingRegistry'
import { formatTokenAmount } from '@/utils/atpFormatters'

/**
 * Formats a number with thousand separators
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Formats APR as percentage
 */
const formatAPR = (apr: number): string => {
  return `${apr.toFixed(1)}%`
}

/**
 * Individual metric card component
 */
const MetricCard = ({
  label,
  value,
  isLoading,
  color = 'parchment'
}: {
  label: string
  value: string
  isLoading: boolean
  color?: 'parchment' | 'chartreuse' | 'aqua' | 'orchid'
}) => {
  return (
    <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-6 hover:bg-parchment/8 transition-all">
      <div className="text-xs font-francesco uppercase tracking-wide text-parchment/60 mb-2">
        {label}
      </div>
      {isLoading ? (
        <div className="h-8 bg-parchment/10 animate-pulse rounded" />
      ) : (
        <div className={`font-arizona-serif text-2xl sm:text-3xl font-medium text-${color}`}>
          {value}
        </div>
      )}
    </div>
  )
}

/**
 * Staking summary card displaying key metrics from the API
 */
export const StakingSummaryCard = () => {
  const [showDetails, setShowDetails] = useState(false)
  const { data, isLoading, error, refetch } = useStakingSummary()
  const { symbol, decimals } = useStakingAssetTokenDetails()

  // Format values using formatTokenAmount
  const totalValueLocked = data?.totalValueLocked
    ? formatTokenAmount(BigInt(data.totalValueLocked), decimals, symbol)
    : '0'

  const activationThreshold = data?.stats.activationThreshold
    ? formatTokenAmount(BigInt(data.stats.activationThreshold), decimals, symbol)
    : '0'

  // Error state
  if (error && !data) {
    return (
      <div className="bg-parchment/5 border border-vermillion/20 p-6 text-center">
        <div className="text-vermillion mb-4">
          <div className="flex justify-center mb-2">
            <Icon name="warning" className="w-8 h-8" />
          </div>
          <div className="font-oracle-standard text-sm font-bold uppercase tracking-wide">
            Failed to Load Staking Summary
          </div>
        </div>
        <p className="text-xs text-parchment/60 mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-chartreuse text-ink font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all border-2 border-chartreuse hover:border-parchment"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Value Locked"
          value={totalValueLocked}
          isLoading={isLoading}
          color="chartreuse"
        />
        <MetricCard
          label="Total Stakes"
          value={data ? formatNumber(data.totalStakers) : '0'}
          isLoading={isLoading}
          color="aqua"
        />
        <MetricCard
          label="Current APR"
          value={data ? formatAPR(data.currentAPR) : '0%'}
          isLoading={isLoading}
          color="orchid"
        />
      </div>

      {/* Collapsible Details Section */}
      <div className="bg-parchment/5 border border-parchment/20">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-4 flex items-center justify-between hover:bg-parchment/8 transition-all"
        >
          <span className="font-oracle-standard text-sm font-bold uppercase tracking-wide text-parchment">
            View Details
          </span>
          <Icon
            name="chevronDown"
            size="md"
            className={`text-parchment/60 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          />
        </button>

        {showDetails && (
          <div className="border-t border-parchment/20 p-4 space-y-4">
            {/* Stakes Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-ink/20 border border-parchment/10 p-4 rounded">
                <h4 className="font-oracle-standard text-xs font-bold uppercase tracking-wide text-parchment/80 mb-3">
                  Stakes Distribution
                </h4>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-parchment/10 animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-parchment/10 animate-pulse rounded w-2/3" />
                    <div className="h-4 bg-parchment/10 animate-pulse rounded w-1/2" />
                  </div>
                ) : data ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-parchment/60">Total Stakes:</span>
                      <span className="font-mono text-parchment">{formatNumber(data.stats.totalStakes)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-parchment/60">Delegated:</span>
                      <span className="font-mono text-aqua">{formatNumber(data.stats.delegatedStakes)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-parchment/60">Direct:</span>
                      <span className="font-mono text-chartreuse">{formatNumber(data.stats.directStakes)}</span>
                    </div>
                    {/* Simple percentage bar */}
                    {data.stats.totalStakes > 0 && (
                      <div className="mt-3 pt-3 border-t border-parchment/10">
                        <div className="h-2 bg-ink/40 rounded overflow-hidden">
                          <div className="h-full flex">
                            <div
                              className="bg-chartreuse"
                              style={{ width: `${(data.stats.directStakes / data.stats.totalStakes) * 100}%` }}
                            />
                            <div
                              className="bg-aqua"
                              style={{ width: `${(data.stats.delegatedStakes / data.stats.totalStakes) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <span className="text-chartreuse">
                            Direct {((data.stats.directStakes / data.stats.totalStakes) * 100).toFixed(1)}%
                          </span>
                          <span className="text-aqua">
                            Delegated {((data.stats.delegatedStakes / data.stats.totalStakes) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="bg-ink/20 border border-parchment/10 p-4 rounded">
                <h4 className="font-oracle-standard text-xs font-bold uppercase tracking-wide text-parchment/80 mb-3">
                  Network Stats
                </h4>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-parchment/10 animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-parchment/10 animate-pulse rounded w-2/3" />
                    <div className="h-4 bg-parchment/10 animate-pulse rounded w-1/2" />
                  </div>
                ) : data ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-parchment/60">Active Providers:</span>
                      <span className="font-mono text-parchment">{formatNumber(data.stats.activeProviders)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-parchment/60">Total Token Vaults:</span>
                      <span className="font-mono text-parchment">{formatNumber(data.stats.totalATPs)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-parchment/60">Activation Threshold:</span>
                      <span className="font-mono text-orchid">{activationThreshold}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-aqua/10 border border-aqua/20 p-3 rounded">
              <div className="flex items-center gap-2 text-xs text-aqua">
                <Icon name="info" size="md" />
                <span>Data refreshes automatically every 30 seconds</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StakingSummaryCard