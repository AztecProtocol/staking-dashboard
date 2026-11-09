import { useMemo } from "react"
import type { Address } from "viem"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useVestingCalculation } from "@/hooks/atp"
import { isAuctionRegistry } from "@/hooks/atpRegistry"

interface VestingGraphProps {
  globalLock: {
    startTime: bigint
    cliff: bigint
    endTime: bigint
    allocation: bigint
  }
  atpType?: string
  registryAddress?: Address
  className?: string
  /** Blockchain timestamp to use for "NOW" position. Falls back to Date.now() if not provided */
  blockTimestamp?: bigint
}

/**
 * SVG vector graph showing cliff vesting pattern
 */
export const VestingGraph = ({ globalLock, registryAddress, className = "", blockTimestamp }: VestingGraphProps) => {
  const { symbol, decimals } = useStakingAssetTokenDetails()

  // Check if this is an ATP from auction registry
  const isAuctionATP = isAuctionRegistry(registryAddress)

  // Check for invalid time range
  const hasInvalidTimeRange = Number(globalLock.endTime) < Number(globalLock.startTime)

  // If vesting has completed (end date is before start date in current time context)
  if (hasInvalidTimeRange) {
    return (
      <div className={`card-dark p-8 ${className}`}>
        <div className="flex items-center gap-4 text-left">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded border border-parchment/20 bg-parchment/5">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-arizona-text text-lg text-accent mb-1">Vesting Schedule Complete</h3>
            <p className="font-oracle-standard text-sm text-parchment/60">
              All tokens from this vesting schedule have been fully vested.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const vestingData = useVestingCalculation(globalLock, blockTimestamp)

  const graphData = useMemo(() => {
    // Graph dimensions
    const width = 800
    const height = 380
    const padding = { top: 70, right: 60, bottom: 80, left: 130 }
    const graphWidth = width - padding.left - padding.right
    const graphHeight = height - padding.top - padding.bottom

    // Get time bounds
    const startTime = Number(globalLock.startTime)
    const cliffTime = Number(globalLock.cliff)
    const endTime = Number(globalLock.endTime)
    // Use blockchain timestamp if provided, otherwise fall back to Date.now()
    const now = blockTimestamp ? Number(blockTimestamp) : Math.floor(Date.now() / 1000)

    // Handle edge cases
    const startEqualsCliff = startTime === cliffTime
    const cliffEqualsEnd = cliffTime === endTime

    // Calculate time range for X axis - include NOW if it's before startTime
    const xAxisStart = Math.min(now, startTime)
    const timeRange = endTime - xAxisStart

    // Calculate X positions relative to the full axis range
    const nowPosition = timeRange === 0 ? 0 : ((now - xAxisStart) / timeRange) * graphWidth
    const startX = timeRange === 0 ? 0 : ((startTime - xAxisStart) / timeRange) * graphWidth

    // Calculate cliff X position relative to full axis
    const cliffX = timeRange === 0 ? startX : ((cliffTime - xAxisStart) / timeRange) * graphWidth

    // Create path points for cliff vesting pattern - handle collision cases
    // Note: Path starts at startX (not 0) when NOW is before startTime
    let pathPoints = []

    if (startEqualsCliff && cliffEqualsEnd) {
      // All three points are the same - instant vest
      pathPoints = [
        { x: startX, y: 0 }, // Start at 100%
        { x: graphWidth, y: 0 } // End at 100%
      ]
    } else if (startEqualsCliff) {
      // Start = Cliff, but different from End - immediate cliff unlock then linear
      pathPoints = [
        { x: startX, y: graphHeight - (vestingData.cliffUnlockRatio * graphHeight) }, // Start at cliff %
        { x: graphWidth, y: 0 } // Linear to 100% at end
      ]
    } else if (cliffEqualsEnd) {
      // Cliff = End - stay at 0% until cliff, then jump to 100%
      pathPoints = [
        { x: startX, y: graphHeight }, // Start at 0%
        { x: graphWidth - 1, y: graphHeight }, // Stay at 0% until just before cliff
        { x: graphWidth, y: 0 } // Jump to 100% at cliff/end
      ]
    } else {
      // Normal case - all three points are distinct
      pathPoints = [
        { x: startX, y: graphHeight }, // Start at 0%
        { x: cliffX, y: graphHeight }, // Stay at 0% until cliff
        { x: cliffX, y: graphHeight - (vestingData.cliffUnlockRatio * graphHeight) }, // Jump to cliff %
        { x: graphWidth, y: 0 } // Linear to 100% at end
      ]
    }

    // Create SVG path - area starts at startX (which may be > 0 if now < startTime)
    const linePath = `M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    const areaPath = `M ${startX},${graphHeight} ${pathPoints.map(p => `L ${p.x},${p.y}`).join(' ')} L ${graphWidth},${graphHeight} Z`

    // Calculate current vested position
    let currentY = graphHeight
    if (now >= cliffTime) {
      const vestedRatio = Number(vestingData.currentVestedAmount) / Number(globalLock.allocation)
      currentY = graphHeight - (vestedRatio * graphHeight)
    }

    // Calculate time remaining
    const formatTimeRemaining = (seconds: number) => {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)

      if (days > 0) {
        return `${days}d ${hours}h`
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`
      } else {
        return `${minutes}m`
      }
    }

    const timeNowToStart = Math.max(0, startTime - now)
    const lockDuration = Math.max(0, endTime - startTime)

    return {
      width,
      height,
      padding,
      graphWidth,
      graphHeight,
      linePath,
      areaPath,
      nowPosition: Math.max(0, Math.min(graphWidth, nowPosition)),
      currentY,
      pathPoints,
      startTime,
      cliffTime,
      endTime,
      startX,
      cliffX,
      timeNowToStart,
      lockDuration,
      formatTimeRemaining,
      startEqualsCliff,
      cliffEqualsEnd,
      nowBeforeStart: now < startTime
    }
  }, [globalLock, vestingData, blockTimestamp])

  return (
    <div className={`card-dark p-6 ${className}`}>
      {/* TGE Notice for Auction ATP */}
      {isAuctionATP && (
        <div className="mb-6 p-4 bg-parchment/5 border border-parchment/20 text-left rounded-inset">
          <div className="text-sm text-parchment font-oracle-standard">
            <strong className="text-accent">TGE Notice:</strong> Tokens become available at TGE. TGE is decided by governance. Earliest anticipated in 90 days from start date. Latest is{' '}
            <strong>
              {new Date(Number(globalLock.endTime) * 1000).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </strong>
            {' '}as shown in the graph below.
          </div>
        </div>
      )}

      <svg
        className="w-full h-full"
        viewBox={`0 0 ${graphData.width} ${graphData.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C8FA00" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C8FA00" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF9F2" />
            <stop offset="100%" stopColor="#C8FA00" />
          </linearGradient>

          {/* Filter for glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 249, 242, 0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        <g transform={`translate(${graphData.padding.left}, ${graphData.padding.top})`}>
          {/* Background grid */}
          <rect width={graphData.graphWidth} height={graphData.graphHeight} fill="url(#grid)" />

          {/* Y-axis */}
          <line
            x1="0" y1="0"
            x2="0" y2={graphData.graphHeight}
            stroke="rgba(255, 249, 242, 0.3)"
            strokeWidth="2"
          />

          {/* X-axis */}
          <line
            x1="0" y1={graphData.graphHeight}
            x2={graphData.graphWidth} y2={graphData.graphHeight}
            stroke="rgba(255, 249, 242, 0.3)"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          <text x="-20" y="5" textAnchor="end" fontSize="14" fill="rgba(255, 249, 242, 0.8)" className="font-mono font-bold">
            {formatTokenAmount(globalLock.allocation, decimals, symbol)}
          </text>
          <text x="-20" y="22" textAnchor="end" fontSize="12" fill="rgba(255, 249, 242, 0.5)" className="font-mono">
            100%
          </text>

          {/* Show cliff labels only when cliff unlock ratio > 0 (to avoid overlapping with 0% labels) */}
          {/* Position on outer (left) side if ratio <= 0.6, inside graph if ratio > 0.6 */}
          {vestingData.cliffUnlockRatio > 0.01 && (
            vestingData.cliffUnlockRatio > 0.6 ? (
              <>
                <text x="10" y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) + 2} textAnchor="start" fontSize="9" fill="rgba(200, 250, 0, 0.5)" className="font-mono uppercase">
                  Cliff Unlock
                </text>
                <text x="10" y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) + 17} textAnchor="start" fontSize="14" fill="rgba(200, 250, 0, 0.8)" className="font-mono font-bold">
                  {formatTokenAmount(BigInt(Math.floor(Number(globalLock.allocation) * vestingData.cliffUnlockRatio)), decimals, symbol)}
                </text>
                <text x="10" y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) + 35} textAnchor="start" fontSize="12" fill="rgba(200, 250, 0, 0.6)" className="font-mono">
                  {(vestingData.cliffUnlockRatio * 100).toFixed(2)}%
                </text>
              </>
            ) : (
              <>
                <text x="-20" y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) - 25} textAnchor="end" fontSize="9" fill="rgba(200, 250, 0, 0.5)" className="font-mono uppercase">
                  Cliff Unlock
                </text>
                <text x="-20" y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) - 10} textAnchor="end" fontSize="14" fill="rgba(200, 250, 0, 0.8)" className="font-mono font-bold">
                  {formatTokenAmount(BigInt(Math.floor(Number(globalLock.allocation) * vestingData.cliffUnlockRatio)), decimals, symbol)}
                </text>
                <text x="-20" y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) + 8} textAnchor="end" fontSize="12" fill="rgba(200, 250, 0, 0.6)" className="font-mono">
                  {(vestingData.cliffUnlockRatio * 100).toFixed(2)}%
                </text>
              </>
            )
          )}


          {/* Vesting area */}
          <path
            d={graphData.areaPath}
            fill="url(#areaGradient)"
            opacity="0.8"
          />

          {/* Vesting line */}
          <path
            d={graphData.linePath}
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
          />

          {/* Key points on the line */}
          {graphData.pathPoints.map((point, index) => {
            // Determine label based on edge cases
            let label = ''
            let labelColor = "rgba(255, 249, 242, 0.6)"
            let textAnchor: "start" | "middle" | "end" = "middle"

            if (graphData.startEqualsCliff && graphData.cliffEqualsEnd) {
              // All three are the same
              if (index === 0) {
                label = "Unlock Start/End"
                textAnchor = "start"
                labelColor = "rgba(200, 250, 0, 0.8)"
              }
            } else if (graphData.startEqualsCliff) {
              // Start = Cliff
              if (index === 0) {
                label = "Unlock Start Time"
                textAnchor = "middle"
                labelColor = "rgba(200, 250, 0, 0.8)"
              } else if (index === 1) {
                label = "End"
                textAnchor = "end"
              }
            } else if (graphData.cliffEqualsEnd) {
              // Cliff = End
              if (index === 0) {
                label = "Start"
                textAnchor = "start"
              } else if (index === 2) {
                label = "Cliff/End"
                textAnchor = "end"
                labelColor = "rgba(200, 250, 0, 0.8)"
              }
            } else {
              // Normal case - all distinct
              if (index === 0) {
                label = "Start"
                textAnchor = "start"
              } else if (index === 1) {
                label = "Cliff"
                textAnchor = "middle"
                labelColor = "rgba(200, 250, 0, 0.8)"
              } else if (index === 3) {
                label = "End"
                textAnchor = "end"
              }
            }

            return (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#C8FA00"
                  stroke="#141900"
                  strokeWidth="2"
                />
                {label && (
                  <text
                    x={point.x}
                    y={graphData.graphHeight + 35}
                    textAnchor={textAnchor}
                    fontSize="10"
                    fill={labelColor}
                    className="font-mono"
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Current time indicator */}
          {graphData.nowPosition >= 0 && graphData.nowPosition <= graphData.graphWidth && (
            <g>
              {/* Vertical line */}
              <line
                x1={graphData.nowPosition}
                y1="0"
                x2={graphData.nowPosition}
                y2={graphData.graphHeight}
                stroke="#FFF9F2"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.6"
              />

              {/* Horizontal line to Y-axis showing vested amount */}
              {graphData.currentY < graphData.graphHeight && (
                <>
                  <line
                    x1="0"
                    y1={graphData.currentY}
                    x2={graphData.nowPosition}
                    y2={graphData.currentY}
                    stroke="#FFF9F2"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                  {/* Vested amount label on Y-axis */}
                  <text
                    x="-10"
                    y={graphData.currentY + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#FFF9F2"
                    className="font-mono font-bold"
                  >
                    {formatTokenAmount(vestingData.currentVestedAmount, decimals, symbol)}
                  </text>
                </>
              )}

              {/* Current position dot */}
              <circle
                cx={graphData.nowPosition}
                cy={graphData.currentY}
                r="8"
                fill="#FFF9F2"
                stroke="#141900"
                strokeWidth="2"
                className="animate-pulse"
              />

              {/* Now label */}
              <text
                x={graphData.nowPosition}
                y={graphData.graphHeight + 20}
                textAnchor="middle"
                fontSize="14"
                fill="#FFF9F2"
                className="font-bold"
              >
                NOW
              </text>

            </g>
          )}

          {/* Time period labels */}
          {/* Now to Start - only show when now is before start */}
          {graphData.nowBeforeStart && (
            <g>
              <text
                x={graphData.nowPosition + (graphData.startX - graphData.nowPosition) / 2}
                y={graphData.graphHeight + 65}
                textAnchor="middle"
                fontSize="10"
                fill="#FFF9F2"
                className="font-mono font-bold"
              >
                {graphData.formatTimeRemaining(graphData.timeNowToStart)}
              </text>
              <text
                x={graphData.nowPosition + (graphData.startX - graphData.nowPosition) / 2}
                y={graphData.graphHeight + 78}
                textAnchor="middle"
                fontSize="8"
                fill="rgba(255, 249, 242, 0.6)"
                className="font-mono"
              >
                (Until Vesting Starts)
              </text>
            </g>
          )}

          {/* Lock Duration (Start to End) */}
          <g>
            <text
              x={graphData.startX + (graphData.graphWidth - graphData.startX) / 2}
              y={graphData.graphHeight + 65}
              textAnchor="middle"
              fontSize="10"
              fill="#B6B8B0"
              className="font-mono font-bold"
            >
              {graphData.formatTimeRemaining(graphData.lockDuration)}
            </text>
            <text
              x={graphData.startX + (graphData.graphWidth - graphData.startX) / 2}
              y={graphData.graphHeight + 78}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(182, 184, 176, 0.7)"
              className="font-mono"
            >
              (Vesting Duration)
            </text>
          </g>

          {/* Cliff unlock indicator - only show when ratio > 0 */}
          {vestingData.cliffUnlockRatio > 0.01 && (
            <g>
              <line
                x1={graphData.cliffX}
                y1={graphData.graphHeight}
                x2={graphData.cliffX}
                y2={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight)}
                stroke="#C8FA00"
                strokeWidth="2"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <text
                x={graphData.cliffX + 10}
                y={graphData.graphHeight - (vestingData.cliffUnlockRatio * graphData.graphHeight) - 10}
                fontSize="10"
                fill="#C8FA00"
                className="font-mono font-bold"
              >
                {Math.round(vestingData.cliffUnlockRatio * 100)}%
              </text>
            </g>
          )}

          {/* Date markers with vertical lines - Handle collisions */}
          {!graphData.startEqualsCliff && (
            <g>
              <line
                x1={graphData.startX}
                y1="0"
                x2={graphData.startX}
                y2={graphData.graphHeight}
                stroke="rgba(255, 249, 242, 0.2)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />
              <text
                x={graphData.startX}
                y={graphData.graphHeight + 50}
                textAnchor={graphData.nowBeforeStart ? "middle" : "start"}
                fontSize="9"
                fill="rgba(255, 249, 242, 0.5)"
                className="font-mono"
              >
                {new Date(graphData.startTime * 1000).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                })}
              </text>
            </g>
          )}

          {!graphData.cliffEqualsEnd && !graphData.startEqualsCliff && (
            <g>
              <line
                x1={graphData.cliffX}
                y1="0"
                x2={graphData.cliffX}
                y2={graphData.graphHeight}
                stroke="rgba(200, 250, 0, 0.4)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />
              <text
                x={graphData.cliffX}
                y={graphData.graphHeight + 50}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(200, 250, 0, 0.8)"
                className="font-mono"
              >
                {new Date(graphData.cliffTime * 1000).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                })}
              </text>
            </g>
          )}

          {!graphData.cliffEqualsEnd && (
            <g>
              <line
                x1={graphData.graphWidth}
                y1="0"
                x2={graphData.graphWidth}
                y2={graphData.graphHeight}
                stroke="rgba(255, 249, 242, 0.2)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />
              <text
                x={graphData.graphWidth}
                y={graphData.graphHeight + 50}
                textAnchor="end"
                fontSize="9"
                fill="rgba(255, 249, 242, 0.7)"
                className="font-mono"
              >
                {new Date(graphData.endTime * 1000).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                })}
              </text>
            </g>
          )}

          {/* Combined date marker for collisions */}
          {(graphData.startEqualsCliff || graphData.cliffEqualsEnd) && (
            <g>
              <line
                x1={graphData.cliffEqualsEnd ? graphData.graphWidth : graphData.startX}
                y1="0"
                x2={graphData.cliffEqualsEnd ? graphData.graphWidth : graphData.startX}
                y2={graphData.graphHeight}
                stroke="rgba(200, 250, 0, 0.4)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />
              <text
                x={graphData.cliffEqualsEnd ? graphData.graphWidth : graphData.startX}
                y={graphData.graphHeight + 50}
                textAnchor={graphData.cliffEqualsEnd ? "end" : (graphData.nowBeforeStart ? "middle" : "start")}
                fontSize="9"
                fill="rgba(200, 250, 0, 0.8)"
                className="font-mono"
              >
                {new Date((graphData.cliffEqualsEnd ? graphData.cliffTime : graphData.startTime) * 1000).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                })}
              </text>
            </g>
          )}

        </g>

        {/* Title - positioned inside graph area, higher than NOW labels */}
        <g transform={`translate(${graphData.padding.left}, ${graphData.padding.top})`}>
          <text x={graphData.graphWidth / 2} y="-50" textAnchor="middle" fontSize="16" fill="rgba(255, 249, 242, 0.8)" className="font-oracle-standard font-bold uppercase">
            Vesting Schedule
          </text>
        </g>
      </svg>

      {/* Note at the bottom */}
      <div className="mt-6 text-center text-xs text-parchment/60 font-oracle-standard">
        <strong>Note:</strong> At the Unlock Start Time, tokens unlock linearly per Ethereum block.
      </div>
    </div>
  )
}