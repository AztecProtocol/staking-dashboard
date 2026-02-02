/**
 * Utility functions for validator dashboard integration
 */

/**
 * Get the base validator dashboard URL
 * @returns Base URL for the validator dashboard
 */
export const getValidatorDashboardUrl = (): string => {
  return import.meta.env.VITE_VALIDATOR_DASHBOARD_URL || ''
}

/**
 * Get the validator dashboard URL for a specific validator
 * @param validatorAddress - The validator address to view
 * @returns Full URL to view the validator in the dashboard
 */
export const getValidatorDashboardValidatorUrl = (validatorAddress: string): string => {
  const baseUrl = getValidatorDashboardUrl()
  return `${baseUrl}/search?q=${validatorAddress}`
}

/**
 * Get the validator dashboard URL for a specific provider
 * @param providerId - The provider ID to view
 * @returns Full URL to view the provider in the dashboard
 */
export const getValidatorDashboardProviderUrl = (providerId: string | number): string => {
  const baseUrl = getValidatorDashboardUrl()
  return `${baseUrl}/providers/${providerId}`
}

/**
 * Get the validator dashboard queue URL
 * @returns Full URL to view the queue in the dashboard
 */
export const getValidatorDashboardQueueUrl = (): string => {
  const baseUrl = getValidatorDashboardUrl()
  return `${baseUrl}/queue`
}
