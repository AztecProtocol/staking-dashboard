# Providers

Provider metadata for the staking dashboard.

## File Structure

File name format: `{providerId}-{provider-name}.json`

Example: `1-aztec-foundation.json`

```json
{
  "providerId": 1,
  "providerName": "Aztec Foundation",
  "providerDescription": "Brief description of the provider",
  "providerEmail": "contact@provider.com",
  "providerWebsite": "https://provider.com",
  "providerLogoUrl": "https://provider.com/logo.png",
  "discordUsername": "username",
  "providerSelfStake": ["0x1234...", "0x5678..."]
}
```

## Adding a Provider

1. Copy `_example.json` to `{providerId}-{provider-name}.json`
2. Fill in your details
3. Submit a pull request

## Rules

**Required:** `providerId` must match on-chain registration and be unique.

**Optional:** All other fields are optional. Invalid or missing fields will display as empty on the dashboard.

**Self-stake:** `providerSelfStake` is an optional array of attester addresses for sequencers the provider directly stakes. Omit this field if empty.

**Duplicates:** If multiple files have the same `providerId`, only the first file (alphabetically) will be used.
