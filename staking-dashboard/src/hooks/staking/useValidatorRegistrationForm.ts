import { useState, useCallback } from "react"
import type { ValidatorRegistrationForm } from "@/types/stakingForm"
import { convertRawToValidatorKeys, validateValidatorKeys } from "@/types/keystore"
import { useBaseFormValidation } from "./useBaseFormValidation"

/**
 * Hook for managing validator registration form data
 * Handles only form state, no navigation logic
 */
export const useValidatorRegistrationForm = () => {
  const { validateBaseFields, getBaseValidationErrors } = useBaseFormValidation()

  const [formData, setFormData] = useState<ValidatorRegistrationForm>({
    selectedAtp: null,
    selectedStakerVersion: null,
    selectedOperator: null,
    isTokenApproved: false,
    isStakerUpgraded: false,
    isOperatorConfigured: false,
    approvalAmount: null,
    stakeCount: 1,
    transactionType: "self-stake",
    uploadedKeystores: [],
    validatorRunningConfirmed: false
  })

  const updateFormData = useCallback((updates: Partial<ValidatorRegistrationForm>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const validateFormData = useCallback((): boolean => {
    // First validate base fields
    if (!validateBaseFields(formData)) {
      return false
    }

    if (formData.uploadedKeystores.length === 0) {
      return false
    }
    const allKeystoresValid = formData.uploadedKeystores.every(keystore =>
      validateValidatorKeys(convertRawToValidatorKeys(keystore))
    )

    return allKeystoresValid && formData.validatorRunningConfirmed
  }, [formData, validateBaseFields])

  const getValidationErrors = useCallback((): string[] => {
    const errors = getBaseValidationErrors(formData)

    if (formData.uploadedKeystores.length === 0) {
      errors.push("At least one sequencer key must be uploaded")
    } else {
      const invalidKeystores = formData.uploadedKeystores.filter(keystore =>
        !validateValidatorKeys(convertRawToValidatorKeys(keystore))
      )
      if (invalidKeystores.length > 0) {
        errors.push(`${invalidKeystores.length} sequencer key${invalidKeystores.length > 1 ? 's are' : ' is'} invalid`)
      }
    }
    if (!formData.validatorRunningConfirmed) {
      errors.push("Sequencer running confirmation is required")
    }

    return errors
  }, [formData, getBaseValidationErrors])

  return {
    formData,
    updateFormData,
    validateFormData,
    getValidationErrors
  }
}
