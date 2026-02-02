import { useState, useCallback, useEffect } from "react"

/**
 * Generic hook for managing multi-step flow navigation
 * Handles step progression, visited steps tracking, navigation, and step validation
 * Auto-skips steps on first visit if they are already valid
 * Used by all staking flows (validator registration, provider delegation, etc.)
 */
export const useStakingNavigation = (totalSteps: number) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set())
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({})
  const [autoSkipEnabled, setAutoSkipEnabled] = useState<Record<number, boolean>>({})

  const handleNextStep = useCallback(() => {
    setVisitedSteps(prev => new Set(prev).add(currentStep))
    const nextStep = Math.min(totalSteps, currentStep + 1)
    setCurrentStep(nextStep)
  }, [currentStep, totalSteps])

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [])

  const goToStep = useCallback((step: number) => {
    setVisitedSteps(prev => new Set(prev).add(currentStep))
    setCurrentStep(Math.max(1, Math.min(totalSteps, step)))
  }, [currentStep, totalSteps])

  const isFirstVisit = useCallback((step: number) => {
    return !visitedSteps.has(step)
  }, [visitedSteps])

  const setStepValid = useCallback((step: number, isValid: boolean, autoSkip = true) => {
    setStepValidation(prev => ({ ...prev, [step]: isValid }))
    setAutoSkipEnabled(prev => ({ ...prev, [step]: autoSkip }))
  }, [])

  const canContinue = useCallback((step?: number) => {
    const targetStep = step ?? currentStep
    return stepValidation[targetStep] ?? false
  }, [currentStep, stepValidation])

  const resetVisitedSteps = useCallback(() => {
    setVisitedSteps(new Set())
    setStepValidation({})
    setAutoSkipEnabled({})
    setCurrentStep(1)
  }, [])

  const resetStepsTo = useCallback((stepNumber: number) => {
    const targetStep = Math.max(1, Math.min(totalSteps, stepNumber))

    // Keep visited steps up to and including targetStep
    setVisitedSteps(prev => {
      const newVisited = new Set<number>()
      for (let i = 1; i <= targetStep; i++) {
        if (prev.has(i)) {
          newVisited.add(i)
        }
      }
      return newVisited
    })

    // Keep validation only for steps up to targetStep
    setStepValidation(prev => {
      const newValidation: Record<number, boolean> = {}
      Object.keys(prev).forEach(key => {
        const step = Number(key)
        if (step <= targetStep) {
          newValidation[step] = prev[step]
        }
      })
      return newValidation
    })

    // Keep auto-skip only for steps up to targetStep
    setAutoSkipEnabled(prev => {
      const newAutoSkip: Record<number, boolean> = {}
      Object.keys(prev).forEach(key => {
        const step = Number(key)
        if (step <= targetStep) {
          newAutoSkip[step] = prev[step]
        }
      })
      return newAutoSkip
    })

    setCurrentStep(targetStep)
  }, [totalSteps])

  // Auto-skip on first visit if step is already valid and auto-skip is enabled
  useEffect(() => {
    const isFirstVisit = !visitedSteps.has(currentStep)
    const isStepValid = stepValidation[currentStep] ?? false
    const shouldAutoSkip = autoSkipEnabled[currentStep] ?? true

    if (isFirstVisit && isStepValid && shouldAutoSkip && currentStep < totalSteps) {
      handleNextStep()
    }
  }, [currentStep, visitedSteps, stepValidation, autoSkipEnabled, totalSteps, handleNextStep])

  return {
    currentStep,
    visitedSteps,
    handleNextStep,
    handlePrevStep,
    goToStep,
    isFirstVisit,
    setStepValid,
    canContinue,
    resetVisitedSteps,
    resetStepsTo
  }
}
