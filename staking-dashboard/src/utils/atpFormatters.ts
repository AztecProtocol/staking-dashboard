import { formatEther, formatUnits } from "viem"
import type { ATPData } from "@/hooks/atp"

/**
 * Get human-readable name for ATP type
 */
export function getTypeName(typeString?: string): string {
  switch (typeString) {
    case 'MATP':
      return "Milestone ATP"
    case 'LATP':
      return "Linear ATP"
    default:
      return "Unknown ATP"
  }
}

/**
 * Format bigint amount to human-readable AZTEC string
 */
export function formatAztecAmount(amount?: bigint): string {
  amount = amount ? amount : 0n
  return Number(formatEther(amount)).toLocaleString()
}

/**
 * Format bigint amount with AZTEC suffix
 */
export function formatAztecWithSuffix(amount?: bigint): string {
  return `${formatAztecAmount(amount)} AZTEC`
}

/**
 * Calculate stakeable amount (allocation - claimed)
 */
export function getStakeableAmount(atp: ATPData): bigint {
  if (atp.claimable) {
    return atp.claimable
  }
  if (atp.allocation && atp.claimed) {
    return atp.allocation - atp.claimed
  }
  return atp.allocation || 0n
}

/**
 * Calculate time until claimable
 */
export function getTimeToClaimForATP(atp: ATPData): string {
  if (atp.globalLock?.endTime) {
    const now = Math.floor(Date.now() / 1000)
    const endTime = Number(atp.globalLock.endTime)
    const timeLeft = endTime - now

    if (timeLeft <= 0) {
      return "Available now"
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60))
    if (days === 0) {
      const hours = Math.floor(timeLeft / (60 * 60))
      return `${hours} hours`
    }

    return `${days} days`
  }

  return "Available now"
}

/**
 * Check if operator is not set (zero address or undefined)
 */
export function isOperatorNotSet(operator?: string): boolean {
  return !operator || operator === "0x0000000000000000000000000000000000000000"
}

/**
 * Safely convert a string or number to BigInt, handling scientific notation
 * This is needed because BigInt() cannot parse scientific notation like "2e+23"
 */
export function stringToBigInt(value: string | number | bigint): bigint {
  if (typeof value === 'bigint') {
    return value
  }

  try {
    // If it's a string that might be in scientific notation, convert through Number first
    const numValue = typeof value === 'string' ? Number(value) : value

    // Check if the number is in scientific notation or is a float
    if (numValue === 0) {
      return 0n
    }

    // Convert to BigInt, using Math.floor to handle any decimals
    return BigInt(Math.floor(numValue))
  } catch (e) {
    console.error('Error converting to BigInt:', e, value)
    return 0n
  }
}

/**
 * Format token amount with proper decimals and symbol
 * Falls back to AZTEC formatting if decimals/symbol not provided
 */
export function formatTokenAmount(amount?: bigint, decimals?: number, symbol?: string, precision: number = 1): string {
  amount = amount ? amount : 0n

  // Use provided decimals and symbol if available
  if (decimals !== undefined && symbol) {
    const numValue = Number(formatUnits(amount, decimals))
    const formatted = formatWithDenomination(numValue, precision)
    return `${formatted} ${symbol}`
  }

  // Fallback to AZTEC formatting (assumes 18 decimals)
  const numValue = Number(formatEther(amount))
  const formatted = formatWithDenomination(numValue, precision)
  return `${formatted} AZTEC`
}

/**
 * Format token amount without denomination (no K, M, B)
 * Shows full number with comma separators, rounded to nearest whole number
 */
export function formatTokenAmountFull(amount?: bigint, decimals?: number, symbol?: string): string {
  amount = amount ? amount : 0n

  // Use provided decimals and symbol if available
  if (decimals !== undefined && symbol) {
    const numValue = Math.round(Number(formatUnits(amount, decimals)))
    return `${numValue.toLocaleString()} ${symbol}`
  }

  // Fallback to AZTEC formatting (assumes 18 decimals)
  const numValue = Math.round(Number(formatEther(amount)))
  return `${numValue.toLocaleString()} AZTEC`
}

/**
 * Format number with denomination (K, M, B) for values >= 1000, with configurable precision
 * Only shows decimal places if the value has decimals
 */
function formatWithDenomination(value: number, precision: number = 1): string {
  const formatNumber = (num: number) => {
    const fixed = num.toFixed(precision)
    // Remove trailing zeros and decimal point if not needed
    return parseFloat(fixed).toString()
  }

  if (value >= 1000000000) {
    return `${formatNumber(value / 1000000000)}B`
  } else if (value >= 1000000) {
    return `${formatNumber(value / 1000000)}M`
  } else if (value >= 1000) {
    return `${formatNumber(value / 1000)}K`
  } else {
    return formatNumber(value)
  }
}

/**
 * Convert unix timestamp/epoch value from smart contract to milliseconds for Date constructor
 */
export function epochToMilliseconds(epochValue: bigint | number): number {
  const epochSeconds = typeof epochValue === 'bigint' ? Number(epochValue) : epochValue
  return epochSeconds * 1000
}

/**
 * Get current unix timestamp in seconds (matching smart contract format)
 */
export function getCurrentEpochSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Format cliff period duration by calculating the difference from start time
 * If cliff appears to be an absolute timestamp, subtract start time to get duration
 */
export function formatCliffDuration(cliffValue: bigint | number, startTime: bigint | number): string {
  const cliffSeconds = typeof cliffValue === 'bigint' ? Number(cliffValue) : cliffValue
  const startSeconds = typeof startTime === 'bigint' ? Number(startTime) : startTime

  // If cliff appears to be an absolute timestamp (much larger than reasonable duration)
  // then calculate duration by subtracting start time
  let durationSeconds = cliffSeconds
  if (cliffSeconds > startSeconds && cliffSeconds > 365 * 24 * 60 * 60) { // More than 1 year suggests timestamp
    durationSeconds = cliffSeconds - startSeconds
  }

  if (durationSeconds <= 0) {
    return "No cliff period"
  }

  // Use same calculation as getTimeToClaimForATP
  const days = Math.floor(durationSeconds / (24 * 60 * 60))
  if (days === 0) {
    const hours = Math.floor(durationSeconds / (60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(durationSeconds / 60)
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return `${days} day${days !== 1 ? 's' : ''}`
}

/**
 * Format duration from unix timestamp/epoch values to human-readable string
 * Handles the conversion internally using epoch timestamp methods
 */
export function formatDuration(epochValue: bigint | number): string {
  // Convert bigint to number if needed (epoch values from smart contracts)
  const epochSeconds = typeof epochValue === 'bigint' ? Number(epochValue) : epochValue

  if (epochSeconds <= 0) {
    return "No duration"
  }

  // Use same calculation as getTimeToClaimForATP - treat as unix timestamp in seconds
  const days = Math.floor(epochSeconds / (24 * 60 * 60))
  if (days === 0) {
    const hours = Math.floor(epochSeconds / (60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(epochSeconds / 60)
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return `${days} day${days !== 1 ? 's' : ''}`
}

/**
 * Identify mock data (for testing purposes - should be removed in production)
 */
export function isMockATP(atp: ATPData): boolean {
  return (
    atp.atpAddress.startsWith("0x1234567890") ||
    atp.atpAddress.startsWith("0x9876543210")
  )
}