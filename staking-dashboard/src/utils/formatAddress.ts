/**
 * Formats an Ethereum address by showing the first n and last m characters
 * @param address - The Ethereum address to format
 * @param firstChars - Number of characters to show at the beginning (default: 6)
 * @param lastChars - Number of characters to show at the end (default: 4)
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  firstChars: number = 18,
  lastChars: number = 4,
): string {
  if (!address) return "";

  // If address is shorter than the total characters to show, return as is
  if (address.length <= firstChars + lastChars) {
    return address;
  }

  return `${address.slice(0, firstChars)}...${address.slice(-lastChars)}`;
}
