/**
 * Formats a Unix timestamp to "28 Aug 2026 14:30 (CET)" format
 * @param timestamp - Unix timestamp (in seconds) as bigint
 * @returns Formatted date string with timezone
 */
export function formatDateTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const timezone = date
    .toLocaleTimeString("en-US", { timeZoneName: "short" })
    .split(" ")
    .pop();
  return `${day} ${month} ${year} ${hours}:${minutes} (${timezone})`;
}

/**
 * Formats a block timestamp or ISO date string to local date and time
 * @param timestamp - Unix timestamp (in seconds) or ISO date string
 * @returns Object with separate date and time strings
 */
export function formatBlockTimestamp(timestamp: string | number): { date: string; time: string } {
  try {
    let date: Date

    if (typeof timestamp === 'string') {
      // Handle ISO date string
      date = new Date(timestamp)
    } else {
      // Handle Unix timestamp (seconds)
      date = new Date(timestamp * 1000)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { date: 'Invalid date', time: '' }
    }

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error)
    return { date: 'Invalid date', time: '' }
  }
}

interface UnlockTimeDisplayParams {
  isExiting: boolean
  actualUnlockTime?: bigint
  withdrawalDelayDays?: number
}

/**
 * Formats the unlock time for withdrawal display
 * @param params - Object containing isExiting status, actualUnlockTime timestamp, and withdrawalDelayDays
 * @returns Formatted unlock time string for display
 */
export function getUnlockTimeDisplay({ isExiting, actualUnlockTime, withdrawalDelayDays }: UnlockTimeDisplayParams): string {
  if (isExiting && actualUnlockTime && actualUnlockTime > 0n) {
    const { date, time } = formatBlockTimestamp(Number(actualUnlockTime))
    return `Unlocks: ${date} ${time}`
  }
  if (withdrawalDelayDays !== undefined) {
    const days = Math.round(withdrawalDelayDays * 10) / 10
    return `Est. unlock: ~${days} days after initiation`
  }
  return "Available after waiting period"
}
