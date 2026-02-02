import { useState, useCallback } from "react"
import type { ProviderDelegationForm } from "@/types/stakingForm"
import type { ProviderDetail } from "@/hooks/providers/useProviderDetail"
import { useBaseFormValidation } from "./useBaseFormValidation"

/**
 * Hook for managing provider delegation form data
 * Handles only form state, no navigation logic
 * Extends base staking form with provider-specific fields
 */
export const useProviderDelegationForm = (provider: ProviderDetail) => {
  const { validateBaseFields, getBaseValidationErrors } = useBaseFormValidation()

  const [formData, setFormData] = useState<ProviderDelegationForm>({
    selectedAtp: null,
    selectedStakerVersion: null,
    selectedOperator: null,
    isTokenApproved: false,
    isStakerUpgraded: false,
    isOperatorConfigured: false,
    approvalAmount: null,
    selectedProvider: provider,
    stakeCount: 1,
    // used for transaction queue / batching
    transactionType: "delegation",
    transactionMetadata: {
      providerId: Number(provider.id),
      providerName: provider.name
    }
  })

  const updateFormData = useCallback((updates: Partial<ProviderDelegationForm>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const validateFormData = useCallback((): boolean => {
    if (!validateBaseFields(formData)) {
      return false
    }

    return formData.selectedProvider !== null
  }, [formData, validateBaseFields])

  const getValidationErrors = useCallback((): string[] => {
    const errors = getBaseValidationErrors(formData)

    if (!formData.selectedProvider) {
      errors.push("Provider must be selected")
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
