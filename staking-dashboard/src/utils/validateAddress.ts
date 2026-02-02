import { isAddress, getAddress } from 'viem'

/**
 * Validates an Ethereum address
 * @param address - The address to validate
 * @returns true if the address is valid
 */
export const validateAddress = (address: string): boolean => {
  if (!address) return false

  try {
    // viem's isAddress checks if it's a valid Ethereum address
    return isAddress(address)
  } catch {
    return false
  }
}

/**
 * Validates and checksums an Ethereum address
 * @param address - The address to validate and checksum
 * @returns The checksummed address if valid, null otherwise
 */
export const getValidChecksumAddress = (address: string): string | null => {
  if (!address) return null

  try {
    if (isAddress(address)) {
      // Returns the checksummed version of the address
      return getAddress(address)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Validates an attester address for keystore
 * Ensures the address is valid, not zero address, and properly formatted
 * @param address - The attester address to validate
 * @returns Object with validation result and error message if invalid
 */
export const validateAttesterAddress = (address: string): {
  isValid: boolean;
  error?: string;
  checksummedAddress?: string;
} => {
  // Check if address is provided
  if (!address || address.trim() === '') {
    return {
      isValid: false,
      error: 'Attester address is required'
    }
  }

  // Check if it's a valid Ethereum address
  if (!isAddress(address)) {
    return {
      isValid: false,
      error: 'Invalid Ethereum address format'
    }
  }

  // Check if it's the zero address
  const checksummedAddress = getAddress(address)
  if (checksummedAddress === '0x0000000000000000000000000000000000000000') {
    return {
      isValid: false,
      error: 'Cannot use zero address as attester'
    }
  }

  // Check if it's a burn address (all zeros with a prefix)
  if (checksummedAddress.toLowerCase().match(/^0x0+[1-9a-f]$/i)) {
    return {
      isValid: false,
      error: 'Cannot use burn address as attester'
    }
  }

  return {
    isValid: true,
    checksummedAddress
  }
}