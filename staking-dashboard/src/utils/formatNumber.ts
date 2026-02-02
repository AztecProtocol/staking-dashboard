import { formatEther } from "viem"

/**
 * Formats a number to display with k/m/b suffixes
 * @param num - The number to format
 * @returns Formatted string like "150k", "23m", "12b"
 */
export function formatNumber(num: number): string {
  if (num === 0) return "0";

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1000000000) {
    return sign + Math.round(absNum / 1000000000) + "B";
  } else if (absNum >= 1000000) {
    return sign + Math.round(absNum / 1000000) + "M";
  } else if (absNum >= 1000) {
    return sign + Math.round(absNum / 1000) + "k";
  } else {
    return num.toString();
  }
}

/**
 * Formats a bigint value to a compact string representation
 * @param value The bigint value to format (in wei)
 * @returns Formatted string (e.g., "1.2M", "500k", "123")
 */
export function formatCompact(value: bigint | undefined): string {
  if (!value) return "0";

  const etherValue = Number(formatEther(value));

  if (etherValue >= 1000000) {
    return (etherValue / 1000000).toString().replace(/\.0+$/, "") + "M";
  }

  if (etherValue >= 1000) {
    return (etherValue / 1000).toString().replace(/\.0+$/, "") + "k";
  }

  return etherValue.toString();
}

/**
 * Converts basis points (bips) to percentage
 * @param bips - Value in basis points (1 bip = 0.01%)
 * @param decimals - Number of decimal places to display (default: 2)
 * @returns Formatted percentage string
 * @example formatBipsToPercentage(500) // "5"
 * @example formatBipsToPercentage(250) // "2.5"
 * @example formatBipsToPercentage(333, 2) // "3.33"
 */
export function formatBipsToPercentage(bips: number, decimals: number = 2): string {
  const percentage = bips / 100;

  // Remove trailing zeros and decimal point if not needed
  const formatted = percentage.toFixed(decimals);
  return parseFloat(formatted).toString();
}
