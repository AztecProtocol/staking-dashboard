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
  subline,
  isLoading,
  color = 'parchment'
}: {
  label: string
  value: string
  /** Small text below the main value (e.g. "+12 exiting · +4 zombie"). Hidden when undefined. */
  subline?: string
  isLoading: boolean
  color?: 'parchment' | 'chartreuse' | 'aqua' | 'orchid'
}) => {
  return (
    <div className="glass p-4 sm:p-6 hover:bg-parchment/8 transition-all">
      <div className="text-xs font-oracle-standard uppercase tracking-wide text-parchment/60 mb-2">
        {label}
      </div>
      {isLoading ? (
        <div className="h-8 bg-parchment/10 animate-pulse rounded" />
      ) : (
        <>
          <div className={`font-arizona-serif text-2xl sm:text-3xl font-medium text-${color}`}>
            {value}
          </div>
          {subline && (
            <div className="font-mono text-[10px] sm:text-xs text-parchment/50 mt-1">
              {subline}
            </div>
          )}
        </>
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

  // Format values using formatTokenAmount. We headline the
  // currently-active stake (`activeValueLocked`) rather than the
  // historic "all locked" total — productive sequencer stake is what
  // operators actually care about. The inactive remainder shows up as a
  // small subline.
  const totalLockedBig = data?.totalValueLocked ? BigInt(data.totalValueLocked) : undefined
  const activeLockedBig = data?.activeValueLocked !== undefined
    ? BigInt(data.activeValueLocked)
    : totalLockedBig
  const totalValueStaked = activeLockedBig !== undefined
    ? formatTokenAmount(activeLockedBig, decimals, symbol)
    : '0'

  const activationThreshold = data?.stats.activationThreshold
    ? formatTokenAmount(BigInt(data.stats.activationThreshold), decimals, symbol)
    : '0'

  // Headline sequencer count is `activeStakes` (chain-authoritative).
  // Falls back to `totalStakers` for back-compat with older indexer
  // builds that haven't shipped the field yet.
  const activeStakesCount = data?.stats.activeStakes ?? data?.totalStakers ?? 0
  const exitingStakesCount = data?.stats.exitingStakes ?? 0
  const zombieStakesCount = data?.stats.zombieStakes ?? 0
  const legacyActiveStakesCount = data?.stats.legacyActiveStakes ?? 0

  // Build the "+X exiting · +Y zombie · +Z on older rollups" subline. Only the non-zero
  // buckets render so the line stays compact in steady state.
  const sequencerSubline = (() => {
    const parts: string[] = []
    if (exitingStakesCount > 0) parts.push(`+${formatNumber(exitingStakesCount)} exiting`)
    if (zombieStakesCount > 0) parts.push(`+${formatNumber(zombieStakesCount)} zombie`)
    if (legacyActiveStakesCount > 0) parts.push(`+${formatNumber(legacyActiveStakesCount)} on older rollups`)
    return parts.length > 0 ? parts.join(' · ') : undefined
  })()

  // For the TVL subline we show the token amount held by inactive
  // sequencers: exiting, zombie, or still validating on an older rollup.
  // The indexer reads these balances from chain.
  const stakeSubline = (() => {
    if (totalLockedBig === undefined || activeLockedBig === undefined) return undefined
    const inactive = totalLockedBig - activeLockedBig
    if (inactive <= 0n) return undefined
    return `${formatTokenAmount(inactive, decimals, symbol)} ${legacyActiveStakesCount > 0 ? 'exiting, zombie or on older rollups' : 'exiting or zombie'}`
  })()

  // Error state
  if (error && !data) {
    return (
      <div className="bg-parchment/5 border border-vermillion/20 p-6 text-center rounded-inset">
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
          className="px-4 py-2 btn-lime text-xs"
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
          label="Total Value Staked"
          value={totalValueStaked}
          subline={stakeSubline}
          isLoading={isLoading}
          color="chartreuse"
        />
        <MetricCard
          label="Active Sequencers"
          value={formatNumber(activeStakesCount)}
          subline={sequencerSubline}
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
      <div className="glass">
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
              <div className="glass-inset p-4">
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
                      <span className="font-mono text-accent">{formatNumber(data.stats.directStakes)}</span>
                    </div>
                    {/* Simple percentage bar */}
                    {data.stats.totalStakes > 0 && (
                      <div className="mt-3 pt-3 border-t border-parchment/10">
                        <div className="h-2 bg-parchment/15 rounded-full overflow-hidden">
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
                          <span className="text-accent">
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

              <div className="glass-inset p-4">
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