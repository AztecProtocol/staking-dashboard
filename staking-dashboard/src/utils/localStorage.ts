/**
 * Utility for type-safe localStorage operations with BigInt support
 */

import { getAddress } from "viem"

/**
 * Serializes value to JSON string, converting BigInt to string
 */
const serialize = <T>(value: T): string => {
  return JSON.stringify(value, (_key, val) =>
    typeof val === "bigint" ? val.toString() : val
  )
}

/**
 * Deserializes JSON string to value, converting string back to BigInt where applicable
 */
const deserialize = <T>(json: string, reviver?: (key: string, value: any) => any): T => {
  return JSON.parse(json, reviver)
}

/**
 * Saves value to localStorage with optional serialization
 */
export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    const serialized = serialize(value)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Failed to save to localStorage (key: ${key}):`, error)
  }
}

/**
 * Loads value from localStorage with optional deserialization
 */
export const loadFromLocalStorage = <T>(
  key: string,
  reviver?: (key: string, value: any) => any
): T | null => {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    return deserialize<T>(item, reviver)
  } catch (error) {
    console.error(`Failed to load from localStorage (key: ${key}):`, error)
    return null
  }
}

/**
 * Removes value from localStorage
 */
export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove from localStorage (key: ${key}):`, error)
  }
}

/**
 * Clears all localStorage
 */
export const clearLocalStorage = (): void => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error("Failed to clear localStorage:", error)
  }
}

/**
 * Read user-scoped addresses from localStorage with validation
 */
export function readUserAddresses(
  storageKey: string,
  userAddress: string
): `0x${string}`[] {
  try {
    const key = `${storageKey}_${userAddress.toLowerCase()}`
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const addresses = JSON.parse(stored) as string[]
    // Validate and checksum addresses
    return addresses
      .filter(addr => addr.startsWith("0x") && addr.length === 42)
      .map(addr => getAddress(addr) as `0x${string}`)
  } catch {
    return []
  }
}

/**
 * Write user-scoped addresses to localStorage
 */
export function writeUserAddresses(
  storageKey: string,
  userAddress: string,
  addresses: string[]
): void {
  const key = `${storageKey}_${userAddress.toLowerCase()}`
  const normalized = addresses.map(addr => addr.toLowerCase())
  localStorage.setItem(key, JSON.stringify(normalized))
}
