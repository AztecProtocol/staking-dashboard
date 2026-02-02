import { readFileSync } from 'fs';
import { join } from 'path';

export interface ProviderMetadata {
  providerId: number;
  providerName: string;
  providerDescription: string;
  providerEmail: string;
  providerWebsite: string;
  providerLogoUrl: string;
  discordUsername: string;
  providerSelfStake?: string[];
}

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

/** In-memory cache of provider metadata */
let metadataCache: Map<string, ProviderMetadata> | null = null;
let cacheTimestamp: number = 0;

/**
 * Check if cache is expired
 */
function isCacheExpired(): boolean {
  return Date.now() - cacheTimestamp > CACHE_TTL;
}

/**
 * Load and cache provider metadata from aggregated JSON
 */
function loadMetadata(): Map<string, ProviderMetadata> {
  const metadataMap = new Map<string, ProviderMetadata>();

  try {
    const providersFile = join(__dirname, '../api/data/providers.json');
    const content = readFileSync(providersFile, 'utf-8');
    const providers: ProviderMetadata[] = JSON.parse(content);

    for (const provider of providers) {
      metadataMap.set(provider.providerId.toString(), provider);
    }

    console.log(`Loaded ${metadataMap.size} provider metadata entries`);
  } catch (error) {
    console.warn('Failed to load provider metadata:', error);
  }

  return metadataMap;
}

/**
 * Get metadata for a specific provider (cached with TTL)
 */
export function getProviderMetadata(providerId: string): ProviderMetadata | null {
  if (!metadataCache || isCacheExpired()) {
    metadataCache = loadMetadata();
    cacheTimestamp = Date.now();
  }
  return metadataCache.get(providerId) || null;
}

/**
 * Get all provider metadata (cached with TTL)
 */
export function getAllProviderMetadata(): Map<string, ProviderMetadata> {
  if (!metadataCache || isCacheExpired()) {
    metadataCache = loadMetadata();
    cacheTimestamp = Date.now();
  }
  return metadataCache;
}
