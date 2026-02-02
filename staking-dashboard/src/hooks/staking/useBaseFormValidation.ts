import { useCallback } from "react"
import type { BaseStakingForm } from "@/types/stakingForm"

/**
 * Base validation hook for common staking form fields
 * Can be extended by specific form validators
 */
export const useBaseFormValidation = () => {
  /**
   * Validates base staking form fields
   * Returns true if all base fields are valid
   */
  const validateBaseFields = useCallback((formData: BaseStakingForm): boolean => {
    if (!formData.selectedAtp || formData.selectedStakerVersion === null) {
      return false
    }

    if (!formData.isOperatorConfigured) {
      return false
    }

    if (!formData.isStakerUpgraded) {
      return false
    }

    if (!formData.isTokenApproved) {
      return false
    }

    return true
  }, [])

  /**
   * Gets validation errors for base staking form fields
   * Returns array of error messages
   */
  const getBaseValidationErrors = useCallback((formData: BaseStakingForm): string[] => {
    const errors: string[] = []

    if (!formData.selectedAtp) {
      errors.push("Token Vault must be selected")
    }
    if (formData.selectedStakerVersion === null) {
      errors.push("Staker version must be selected")
    }
    if (!formData.isStakerUpgraded) {
      errors.push("Staker must be upgraded to the latest version")
    }
    if (!formData.isOperatorConfigured) {
      errors.push("Operator must be configured")
    }
    if (!formData.isTokenApproved) {
      errors.push("Token approval required")
    }

    return errors
  }, [])

  return {
    validateBaseFields,
    getBaseValidationErrors
  }
}
