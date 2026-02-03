import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ProviderMetadata {
  providerId: number;
  providerName: string;
  providerDescription: string;
  providerEmail: string;
  providerWebsite: string;
  providerLogoUrl: string;
  discordUsername: string;
  providerSelfStake?: string[];
}

/**
 * Validate and normalize provider metadata
 * Only providerId is required, other fields will fallback to empty strings if invalid
 */
function normalizeProvider(metadata: any, filename: string): ProviderMetadata | null {
  // ProviderId is the only required field
  if (typeof metadata.providerId !== 'number' || metadata.providerId <= 0) {
    console.warn(`⚠️  ${filename}: invalid or missing providerId - skipping`);
    return null;
  }

  const warnings: string[] = [];

  // Helper to validate URL
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Normalize each field
  const providerName = typeof metadata.providerName === 'string' && metadata.providerName.trim()
    ? metadata.providerName.trim()
    : '';

  const providerDescription = typeof metadata.providerDescription === 'string' && metadata.providerDescription.trim()
    ? metadata.providerDescription.trim()
    : '';

  const providerEmail = typeof metadata.providerEmail === 'string' && metadata.providerEmail.trim()
    ? metadata.providerEmail.trim()
    : '';

  const providerWebsite = typeof metadata.providerWebsite === 'string' && validateUrl(metadata.providerWebsite)
    ? metadata.providerWebsite
    : '';

  const providerLogoUrl = typeof metadata.providerLogoUrl === 'string' && validateUrl(metadata.providerLogoUrl)
    ? metadata.providerLogoUrl
    : '';

  const discordUsername = typeof metadata.discordUsername === 'string' && metadata.discordUsername.trim()
    ? metadata.discordUsername.trim()
    : '';

  // Validate providerSelfStake (optional array of attester addresses)
  const providerSelfStake = Array.isArray(metadata.providerSelfStake) && metadata.providerSelfStake.length > 0
    ? metadata.providerSelfStake.filter((addr: any) => typeof addr === 'string' && addr.trim().length > 0)
    : undefined;

  // Collect warnings for missing/invalid fields
  if (!providerName) warnings.push('providerName');
  if (!providerDescription) warnings.push('providerDescription');
  if (!providerEmail) warnings.push('providerEmail');
  if (!providerWebsite) warnings.push('providerWebsite');
  if (!providerLogoUrl) warnings.push('providerLogoUrl');
  if (!discordUsername) warnings.push('discordUsername');

  if (warnings.length > 0) {
    console.warn(`⚠️  ${filename}: missing or invalid fields: ${warnings.join(', ')}`);
  }

  const result: ProviderMetadata = {
    providerId: metadata.providerId,
    providerName,
    providerDescription,
    providerEmail,
    providerWebsite,
    providerLogoUrl,
    discordUsername
  };

  // Only add providerSelfStake if it has valid entries
  if (providerSelfStake && providerSelfStake.length > 0) {
    result.providerSelfStake = providerSelfStake;
  }

  return result;
}

/**
 * Aggregate all provider metadata files into a single JSON file
 */
function aggregateProviders() {
  const providersDir = join(__dirname, '../../providers');
  const outputDir = join(__dirname, '../src/api/data');
  const outputFile = join(outputDir, 'providers.json');

  const providerMap = new Map<number, { provider: ProviderMetadata; filename: string }>();
  let skippedCount = 0;
  let duplicateCount = 0;

  try {
    const files = readdirSync(providersDir).sort(); // Sort to ensure consistent ordering

    for (const file of files) {
      if (!file.endsWith('.json') || file.startsWith('_')) {
        continue;
      }

      try {
        const filePath = join(providersDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const metadata = JSON.parse(content);

        const normalized = normalizeProvider(metadata, file);
        if (!normalized) {
          skippedCount++;
          continue;
        }

        // Check for duplicate provider ID
        if (providerMap.has(normalized.providerId)) {
          const existing = providerMap.get(normalized.providerId)!;
          console.warn(`⚠️  ${file}: duplicate providerId ${normalized.providerId} (keeping ${existing.filename})`);
          duplicateCount++;
          continue;
        }

        providerMap.set(normalized.providerId, { provider: normalized, filename: file });
      } catch (error) {
        console.warn(`⚠️  ${file}: failed to parse JSON - ${error}`);
        skippedCount++;
      }
    }

    // Convert map to array and sort by providerId
    const providers = Array.from(providerMap.values())
      .map(entry => entry.provider)
      .sort((a, b) => a.providerId - b.providerId);

    // Create output directory if it doesn't exist
    mkdirSync(outputDir, { recursive: true });

    // Write aggregated file
    writeFileSync(outputFile, JSON.stringify(providers, null, 2), 'utf-8');

    console.log(`✓ Aggregated ${providers.length} provider metadata file(s) to ${outputFile}`);
    if (duplicateCount > 0) {
      console.log(`⚠️  Skipped ${duplicateCount} duplicate provider ID(s)`);
    }
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} invalid file(s)`);
    }
  } catch (error) {
    console.error('❌ Failed to aggregate provider metadata:', error);
    process.exit(1);
  }
}

aggregateProviders();
