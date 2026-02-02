import { getAddress, isAddress } from 'viem';

/**
 * Converts address to lowercase for database storage
 */
export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return address.toLowerCase();
}

/**
 * Converts address to checksummed format for API responses
 */
export function checksumAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return getAddress(address);
}

/**
 * Normalizes an object's address fields to lowercase for database operations
 */
export function normalizeAddressFields<T extends Record<string, any>>(
  obj: T,
  addressFields: Array<keyof T>
): T {
  const normalized = { ...obj };
  for (const field of addressFields) {
    if (normalized[field] && typeof normalized[field] === 'string') {
      (normalized as any)[field] = normalizeAddress(normalized[field] as string);
    }
  }
  return normalized;
}

/**
 * Checksums an object's address fields for API responses
 */
export function checksumAddressFields<T extends Record<string, any>>(
  obj: T,
  addressFields: Array<keyof T>
): T {
  const checksummed = { ...obj };
  for (const field of addressFields) {
    if (checksummed[field] && typeof checksummed[field] === 'string') {
      (checksummed as any)[field] = checksumAddress(checksummed[field] as string);
    }
  }
  return checksummed;
}
