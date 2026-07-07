import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { AvatarImage } from "@/components/AvatarImage"
import { TooltipIcon } from "@/components/Tooltip"
import { type ProviderListItem, type SortField, type SortDirection, type NotAssociatedStake } from "@/hooks/providers/useProviderTable"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { formatBipsToPercentage } from "@/utils/formatNumber"
import { formatTokenAmount, stringToBigInt } from "@/utils/atpFormatters"
import { useNavigate } from "react-router-dom"
import { zeroAddress } from "viem"

interface ProviderConfiguration {
  providerAdmin: string | undefined
  providerTakeRate: number | undefined
  providerRewardsRecipient: string | undefined
}

interface ProviderTableProps {
  providers: ProviderListItem[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onStakeClick: (provider: ProviderListItem, event: React.MouseEvent) => void
  isLoading?: boolean
  myDelegations?: Map<number, bigint>
  queueLengths?: Map<number, number>
  notAssociatedStake?: NotAssociatedStake
  providerConfigurations?: Map<number, ProviderConfiguration>
  /** Number of top providers to collapse into a group row. Set to 0 to disable. */
  topGroupSize?: number
  /** Whether to show the decentralization separator banner. */
  showDecentralizationBar?: boolean
  /** Row count after which to place the decentralization bar when not grouped. */
  decentralizationBarAfterCount?: number
}

interface ProviderRowProps {
  provider: ProviderListItem
  config?: ProviderConfiguration
  myDelegations?: Map<number, bigint>
  queueLengths?: Map<number, number>
  decimals?: number
  symbol?: string
  isLoadingTokenDetails: boolean
  onStakeClick: (provider: ProviderListItem, event: React.MouseEvent) => void
}

function DecentralizationBarRow() {
  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div className="bg-chartreuse text-ink text-center py-0.5 px-4 text-xs font-oracle-standard font-medium">
          Improve decentralization and network health by staking with a group below ↓
        </div>
      </td>
    </tr>
  )
}

function ProviderRow({
  provider,
  config,
  myDelegations,
  queueLengths,
  decimals,
  symbol,
  isLoadingTokenDetails,
  onStakeClick,
}: ProviderRowProps) {
  const navigate = useNavigate()
  const displayAddress = config?.providerAdmin && config.providerAdmin !== zeroAddress
    ? config.providerAdmin
    : provider.address

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <AvatarImage
            src={provider.logo_url}
            alt={`${provider.name} logo`}
            size="md"
          />
          <div>
            <button
              onClick={() => navigate(`/providers/${provider.id}`)}
              className="font-oracle-triple-book font-medium text-parchment hover:text-chartreuse transition-colors text-left"
            >
              {provider.name}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-parchment/60 font-mono">
                {displayAddress?.slice(0, 8)}...{displayAddress?.slice(-6)}
              </span>
              <CopyButton text={displayAddress || ''} size="sm" className="p-0.5" />
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-mono text-sm text-left">
          <div className="text-chartreuse font-bold text-base whitespace-nowrap">
            {isLoadingTokenDetails ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-chartreuse/30 border-t-chartreuse rounded-full animate-spin"></div>
                <span className="text-parchment/60">Loading...</span>
              </div>
            ) : decimals ? (
              formatTokenAmount(stringToBigInt(provider.totalStaked), decimals, symbol)
            ) : (
              provider.totalStaked
            )}
          </div>
          <div className="text-xs text-parchment/60">
            {provider.percentage}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="text-xs text-parchment/60 font-medium">
            {provider.cumulativePercentage}
          </div>
          <div className="w-full bg-parchment/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-parchment/30 h-full rounded-full"
              style={{ width: provider.cumulativePercentage }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-mono font-bold text-parchment">
          {config?.providerTakeRate !== undefined
            ? `${formatBipsToPercentage(config.providerTakeRate)}%`
            : `${formatBipsToPercentage(provider.commission)}%`}
        </div>
      </TableCell>
      <TableCell>
        {(() => {
          const myDelegation = myDelegations?.get(Number(provider.id)) || 0n
          return myDelegation > 0n ? (
            <div className="font-mono text-sm font-bold text-aqua">
              {isLoadingTokenDetails ? "..." : decimals ? formatTokenAmount(myDelegation, decimals, symbol) : "-"}
            </div>
          ) : (
            <div className="text-sm text-parchment/40">-</div>
          )
        })()}
      </TableCell>
      <TableCell>
        {(() => {
          const queueLength = queueLengths?.get(Number(provider.id)) ?? 0
          const hasSequencerKeys = queueLength > 0

          return (
            <button
              className={`px-3 py-1.5 font-oracle-standard font-bold text-xs uppercase tracking-wider transition-colors ${hasSequencerKeys
                ? 'bg-chartreuse text-ink hover:bg-chartreuse/90'
                : 'bg-parchment/20 text-parchment/40 cursor-not-allowed'
                }`}
              onClick={(e) => hasSequencerKeys && onStakeClick(provider, e)}
              disabled={!hasSequencerKeys}
              title={!hasSequencerKeys ? 'No sequencer keys available' : ''}
            >
              DELEGATE
            </button>
          )
        })()}
      </TableCell>
    </TableRow>
  )
}

/**
 * Table component for displaying staking providers with sorting, search, and
 * an optional top-group row that collapses the highest-stake providers.
 */
export const ProviderTable = ({
  providers,
  sortField,
  sortDirection,
  onSort,
  onStakeClick,
  isLoading = false,
  myDelegations,
  queueLengths,
  notAssociatedStake,
  providerConfigurations,
  topGroupSize = 0,
  showDecentralizationBar = false,
  decentralizationBarAfterCount = 0,
}: ProviderTableProps) => {
  const { symbol, decimals, isLoading: isLoadingTokenDetails } = useStakingAssetTokenDetails()
  const [isGroupExpanded, setIsGroupExpanded] = useState(false)

  // Collapse group whenever it resets (sort/page changes)
  useEffect(() => {
    setIsGroupExpanded(false)
  }, [topGroupSize])

  // The collapsed-group row is rendered whenever a group exists, regardless of
  // expansion state — clicking it toggles between showing the top-N as a
  // single summary (collapsed) and listing them as individual rows below it
  // with a decentralization bar between top-N and rest (expanded). Without
  // this, the row vanishes on expand and the user has no way to fold it back.
  const hasGroup = topGroupSize > 0 && providers.length > topGroupSize
  const groupProviders = hasGroup ? providers.slice(0, topGroupSize) : []
  const restProviders = hasGroup ? providers.slice(topGroupSize) : providers
  const shouldShowInlineBar =
    !hasGroup &&
    showDecentralizationBar &&
    decentralizationBarAfterCount > 0 &&
    providers.length > decentralizationBarAfterCount
  const inlineTopProviders = shouldShowInlineBar ? providers.slice(0, decentralizationBarAfterCount) : []
  const inlineBottomProviders = shouldShowInlineBar ? providers.slice(decentralizationBarAfterCount) : []

  // Aggregate stats for the collapsed group row
  const groupTotalStaked = groupProviders.reduce(
    (sum, p) => sum + stringToBigInt(p.totalStaked),
    0n,
  )
  const groupCumulativePercentage = groupProviders[groupProviders.length - 1]?.cumulativePercentage ?? '0%'
  const groupMyStake = groupProviders.reduce(
    (sum, p) => sum + (myDelegations?.get(Number(p.id)) ?? 0n),
    0n,
  )

  const sharedRowProps = { decimals, symbol, isLoadingTokenDetails, onStakeClick, myDelegations, queueLengths }

  return (
    <Table>
      <TableHeader className="bg-parchment/8">
        <TableRow>
          <TableHead>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSort('name')}
                className="flex items-center gap-1 hover:text-chartreuse transition-colors font-oracle-triple-medium uppercase tracking-wider text-xs text-parchment/60 whitespace-nowrap"
              >
                Provider
                {sortField === 'name' && (
                  <Icon
                    name="chevronDown"
                    size="md"
                    className={sortDirection === 'asc' ? 'rotate-180' : ''}
                  />
                )}
              </button>
              <TooltipIcon
                content="Sequencer providers who manage staking infrastructure. Each provider has a unique name and address for delegation."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
          </TableHead>
          <TableHead className="text-left">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSort('totalStaked')}
                className="flex items-center gap-1 hover:text-chartreuse transition-colors font-oracle-triple-medium uppercase tracking-wider text-xs text-parchment/60 whitespace-nowrap"
              >
                Total Stake
                {sortField === 'totalStaked' && (
                  <Icon
                    name="chevronDown"
                    size="md"
                    className={sortDirection === 'asc' ? 'rotate-180' : ''}
                  />
                )}
              </button>
              <TooltipIcon
                content="Total tokens currently staked with this provider and their percentage of the total network stake."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <span className="font-oracle-triple-medium uppercase tracking-wider text-xs text-parchment/60 whitespace-nowrap">
                Cumulative
              </span>
              <TooltipIcon
                content="Cumulative percentage of network stake when including this provider and all providers above them (sorted by stake)."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSort('commission')}
                className="flex items-center gap-1 hover:text-chartreuse transition-colors font-oracle-triple-medium uppercase tracking-wider text-xs text-parchment/60 whitespace-nowrap"
              >
                Commission
                {sortField === 'commission' && (
                  <Icon
                    name="chevronDown"
                    size="md"
                    className={sortDirection === 'asc' ? 'rotate-180' : ''}
                  />
                )}
              </button>
              <TooltipIcon
                content="Fee percentage taken by the provider from your staking rewards. Lower commission means more rewards for you."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <span className="font-oracle-triple-medium uppercase tracking-wider text-xs text-parchment/60 whitespace-nowrap">
                My Stake
              </span>
              <TooltipIcon
                content="Amount you have delegated to this provider."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <span className="font-oracle-triple-medium uppercase tracking-wider text-xs text-parchment/60 whitespace-nowrap">
                Actions
              </span>
              <TooltipIcon
                content="Delegate your tokens to this provider to start earning rewards. Button is disabled if the provider has no sequencer keys available."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          // Skeleton loading rows
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-parchment/10 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 w-24 bg-parchment/10 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-20 bg-parchment/10 rounded animate-pulse"></div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <div className="h-5 w-20 bg-parchment/10 rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-parchment/10 rounded animate-pulse"></div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="h-3 w-12 bg-parchment/10 rounded animate-pulse"></div>
                  <div className="h-1.5 w-full bg-parchment/10 rounded-full animate-pulse"></div>
                </div>
              </TableCell>
              <TableCell>
                <div className="h-4 w-12 bg-parchment/10 rounded animate-pulse"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 bg-parchment/10 rounded animate-pulse"></div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-20 bg-parchment/10 rounded animate-pulse"></div>
                  <div className="h-4 w-4 bg-parchment/10 rounded animate-pulse"></div>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : providers.length > 0 ? (
          <>
            {/* ── Top-group row ── */}
            {hasGroup && (
              <>
                {/* Collapsed / expanded toggle row */}
                <TableRow
                  className="cursor-pointer select-none"
                  onClick={() => setIsGroupExpanded((prev) => !prev)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Stacked provider avatars */}
                      <div className="flex items-center">
                        {groupProviders.slice(0, 3).map((p, i) => (
                          <div
                            key={p.id}
                            className="rounded-full border-2 border-parchment/10"
                            style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 3 - i, position: 'relative' }}
                          >
                            <AvatarImage src={p.logo_url} alt={p.name} size="sm" />
                          </div>
                        ))}
                        {topGroupSize > 3 && (
                          <div
                            className="w-8 h-8 rounded-full bg-parchment/20 border-2 border-parchment/10 flex items-center justify-center text-xs font-bold text-parchment"
                            style={{ marginLeft: '-8px', zIndex: 0, position: 'relative' }}
                          >
                            +{topGroupSize - 3}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-parchment/50 font-oracle-triple-medium tracking-wide">
                          1–{topGroupSize}
                        </div>
                        <div className="font-oracle-triple-book font-medium text-parchment">
                          Top {topGroupSize} providers
                        </div>
                      </div>

                      <Icon
                        name="chevronDown"
                        size="md"
                        className={`text-parchment/50 transition-transform ${isGroupExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </TableCell>

                  {/* Combined total stake */}
                  <TableCell>
                    <div className="font-mono text-sm text-left">
                      <div className="text-chartreuse font-bold text-base whitespace-nowrap">
                        {isLoadingTokenDetails ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-chartreuse/30 border-t-chartreuse rounded-full animate-spin"></div>
                            <span className="text-parchment/60">Loading...</span>
                          </div>
                        ) : decimals ? (
                          formatTokenAmount(groupTotalStaked, decimals, symbol)
                        ) : (
                          String(groupTotalStaked)
                        )}
                      </div>
                      <div className="text-xs text-parchment/60">combined</div>
                    </div>
                  </TableCell>

                  {/* Cumulative % of the last provider in the group */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-parchment/60 font-medium">
                        {groupCumulativePercentage}
                      </div>
                      <div className="w-full bg-parchment/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-parchment/30 h-full rounded-full"
                          style={{ width: groupCumulativePercentage }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Commission – not meaningful for a group */}
                  <TableCell>
                    <div className="text-sm text-parchment/40">–</div>
                  </TableCell>

                  {/* My combined stake across group providers */}
                  <TableCell>
                    {groupMyStake > 0n ? (
                      <div className="font-mono text-sm font-bold text-aqua">
                        {isLoadingTokenDetails ? "..." : decimals ? formatTokenAmount(groupMyStake, decimals, symbol) : "–"}
                      </div>
                    ) : (
                      <div className="text-sm text-parchment/40">–</div>
                    )}
                  </TableCell>

                  {/* No direct action on a group */}
                  <TableCell />
                </TableRow>


              </>
            )}

            {/* Rendering matrix:
                  - Group + collapsed: group row, decentralization bar, rest
                  - Group + expanded:  group row, top-N individuals, decentralization bar, rest
                  - No group, inline bar enabled: top-N individuals, bar, rest
                  - No group, no bar: all individuals
                The group row itself is rendered above this block. */}
            {hasGroup ? (
              <>
                {isGroupExpanded && groupProviders.map((provider) => (
                  <ProviderRow
                    key={provider.id}
                    provider={provider}
                    config={providerConfigurations?.get(Number(provider.id))}
                    {...sharedRowProps}
                  />
                ))}

                {showDecentralizationBar && <DecentralizationBarRow />}

                {restProviders.map((provider) => (
                  <ProviderRow
                    key={provider.id}
                    provider={provider}
                    config={providerConfigurations?.get(Number(provider.id))}
                    {...sharedRowProps}
                  />
                ))}
              </>
            ) : shouldShowInlineBar ? (
              <>
                {inlineTopProviders.map((provider) => (
                  <ProviderRow
                    key={provider.id}
                    provider={provider}
                    config={providerConfigurations?.get(Number(provider.id))}
                    {...sharedRowProps}
                  />
                ))}

                <DecentralizationBarRow />

                {inlineBottomProviders.map((provider) => (
                  <ProviderRow
                    key={provider.id}
                    provider={provider}
                    config={providerConfigurations?.get(Number(provider.id))}
                    {...sharedRowProps}
                  />
                ))}
              </>
            ) : (
              restProviders.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  config={providerConfigurations?.get(Number(provider.id))}
                  {...sharedRowProps}
                />
              ))
            )}
          </>
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Icon name="search" className="w-12 h-12 text-parchment/30" />
                <div>
                  <div className="font-md-thermochrome text-lg text-parchment/70 mb-2">
                    No providers found
                  </div>
                  <div className="font-arizona-text text-sm text-parchment/50">
                    Try adjusting your search criteria
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* Not Associated Stake Footer Row */}
        {notAssociatedStake && providers.length > 0 && (
          <TableRow className="bg-parchment/5">
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-parchment/10">
                  <Icon name="users" size="md" className="text-parchment/60" />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <div className="flex gap-1.5 items-center">
                      <div className="font-oracle-triple-book font-medium text-parchment">
                        Other
                      </div>
                      <TooltipIcon
                        content="Aggregated solo stake or stake from providers that are not officially acknowledged by Aztec Foundation."
                        size="sm"
                        maxWidth="max-w-xs"
                      />
                    </div>
                    <div className="text-xs text-parchment/60">
                      Unidentified entities
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-mono text-sm text-left">
                <div className="text-parchment/80 font-bold text-base whitespace-nowrap">
                  {isLoadingTokenDetails ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-parchment/30 border-t-parchment rounded-full animate-spin"></div>
                      <span className="text-parchment/60">Loading...</span>
                    </div>
                  ) : decimals ? (
                    formatTokenAmount(stringToBigInt(notAssociatedStake.totalStaked), decimals, symbol)
                  ) : (
                    notAssociatedStake.totalStaked
                  )}
                </div>
                <div className="text-xs text-parchment/60">
                  {notAssociatedStake.percentage}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="text-xs text-parchment/60 font-medium">
                  {notAssociatedStake.cumulativePercentage}
                </div>
                {/* Cumulative progress bar */}
                <div className="w-full bg-parchment/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-parchment/30 h-full rounded-full"
                    style={{ width: notAssociatedStake.cumulativePercentage }}
                  />
                </div>
              </div>
            </TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
