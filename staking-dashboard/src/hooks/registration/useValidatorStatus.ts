import type { ValidatorRegistrationForm } from "@/types/stakingForm"

interface UseValidatorStatusProps {
  uploadedKeystores: ValidatorRegistrationForm['uploadedKeystores']
  completedValidatorsWithQueue: Set<string>
  queuedValidators: Set<string>
}

/**
 * Hook for calculating validator status counts and states
 * Pure computation based on validator states
 */
export function useValidatorStatus({
  uploadedKeystores,
  completedValidatorsWithQueue,
  queuedValidators
}: UseValidatorStatusProps) {
  const numberOfAttesters = uploadedKeystores.length

  // Count remaining sequencers (not queued and not completed via queue)
  const remainingCount = uploadedKeystores.filter(keystore =>
    !queuedValidators.has(keystore.attester) &&
    !completedValidatorsWithQueue.has(keystore.attester)
  ).length

  // Count queued sequencers
  const queuedCount = uploadedKeystores.filter(keystore =>
    !completedValidatorsWithQueue.has(keystore.attester) &&
    queuedValidators.has(keystore.attester)
  ).length

  // Check if all remaining are queued (for Safe/cart execution feedback)
  const allRemainingQueued = remainingCount === 0 && queuedCount > 0

  // Check if registration is complete (all queued or completed via queue)
  const allStakedOrQueued = uploadedKeystores.every(k =>
    queuedValidators.has(k.attester) ||
    completedValidatorsWithQueue.has(k.attester)
  )

  return {
    numberOfAttesters,
    remainingCount,
    queuedCount,
    allRemainingQueued,
    allStakedOrQueued
  }
}
