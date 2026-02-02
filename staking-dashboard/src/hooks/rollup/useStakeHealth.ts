import type { Address } from "viem"
import { useAttesterView } from "./useAttesterView"
import { useEjectionThreshold } from "./useEjectionThreshold"
import { useActivationThresholdFormatted } from "./useActivationThresholdFormatted"

export interface StakeHealth {
  effectiveBalance: bigint | undefined
  activationThreshold: bigint | undefined
  ejectionThreshold: bigint | undefined
  healthPercentage: number
  slashCount: number
  isAtRisk: boolean
  isCritical: boolean
}

// Slash amount is 2,000 tokens with 18 decimals
const SLASH_AMOUNT = 2000n * 10n ** 18n

/**
 * Hook to calculate stake health for an attester
 * Returns health percentage, slash count estimate, and risk indicators
 *
 * Health percentage is calculated as:
 * - 100% = effectiveBalance equals activationThreshold (full stake, no slashes)
 * - 0% = effectiveBalance equals or below ejectionThreshold (will be ejected)
 *
 * Risk levels:
 * - isAtRisk: healthPercentage < 50 (has been slashed significantly)
 * - isCritical: effectiveBalance <= ejectionThreshold (imminent ejection)
 */
export function useStakeHealth(attesterAddress: Address | undefined) {
  const { effectiveBalance, status, isLoading: isLoadingAttester, error: attesterError, refetch: refetchAttester } =
    useAttesterView(attesterAddress)

  const { ejectionThreshold, isLoading: isLoadingEjection, error: ejectionError, refetch: refetchEjection } =
    useEjectionThreshold()

  const { activationThreshold, isLoading: isLoadingActivation, error: activationError } =
    useActivationThresholdFormatted()

  const isLoading = isLoadingAttester || isLoadingEjection || isLoadingActivation
  const error = attesterError || ejectionError || activationError

  let healthPercentage = 100
  let slashCount = 0
  let isAtRisk = false
  let isCritical = false

  if (effectiveBalance !== undefined && activationThreshold !== undefined && ejectionThreshold !== undefined) {
    // Calculate health as percentage between ejection threshold (0%) and activation threshold (100%)
    const healthRange = activationThreshold - ejectionThreshold
    const currentHealth = effectiveBalance - ejectionThreshold

    if (healthRange > 0n) {
      healthPercentage = Math.max(0, Math.min(100,
        Number((currentHealth * 100n) / healthRange)
      ))
    }

    // Estimate slash count based on how much stake has been lost
    if (effectiveBalance < activationThreshold) {
      slashCount = Number((activationThreshold - effectiveBalance) / SLASH_AMOUNT)
    }

    // Risk indicators
    isAtRisk = healthPercentage < 50
    isCritical = effectiveBalance <= ejectionThreshold
  }

  const refetch = () => {
    refetchAttester()
    refetchEjection()
  }

  return {
    effectiveBalance,
    activationThreshold,
    ejectionThreshold,
    healthPercentage,
    slashCount,
    isAtRisk,
    isCritical,
    status,
    isLoading,
    error,
    refetch,
  }
}
