import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"

interface TermsModalContextType {
  isTermsModalOpen: boolean
  hasAcceptedTerms: boolean
  requireTermsAcceptance: (callback: () => void) => void
  acceptTerms: () => void
  closeTermsModal: () => void
}

const TermsModalContext = createContext<TermsModalContextType | undefined>(undefined)

interface TermsModalProviderProps {
  children: ReactNode
}

const TERMS_ACCEPTANCE_KEY = "aztec-staking-terms-accepted"

/**
 * Provider for managing Terms and Conditions modal state
 * Tracks user acceptance in localStorage and handles pending actions
 */
export function TermsModalProvider({ children }: TermsModalProviderProps) {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    const stored = localStorage.getItem(TERMS_ACCEPTANCE_KEY)
    return stored === "true"
  })

  // Use ref to store pending callback - avoids stale closures and race conditions
  const pendingCallbackRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    localStorage.setItem(TERMS_ACCEPTANCE_KEY, String(hasAcceptedTerms))
  }, [hasAcceptedTerms])

  const closeTermsModal = useCallback(() => {
    setIsTermsModalOpen(false)
    // Clear pending callback when modal closes without acceptance
    pendingCallbackRef.current = null
  }, [])

  const acceptTerms = useCallback(() => {
    setHasAcceptedTerms(true)
    setIsTermsModalOpen(false)

    // Execute pending callback if exists
    if (pendingCallbackRef.current) {
      const callback = pendingCallbackRef.current
      pendingCallbackRef.current = null
      callback()
    }
  }, [])

  const requireTermsAcceptance = useCallback((callback: () => void) => {
    if (hasAcceptedTerms) {
      // Already accepted, execute immediately
      callback()
    } else {
      // Not accepted yet, store callback and show modal
      pendingCallbackRef.current = callback
      setIsTermsModalOpen(true)
    }
  }, [hasAcceptedTerms])

  return (
    <TermsModalContext.Provider
      value={{
        isTermsModalOpen,
        hasAcceptedTerms,
        requireTermsAcceptance,
        acceptTerms,
        closeTermsModal
      }}
    >
      {children}
    </TermsModalContext.Provider>
  )
}

/**
 * Hook to access terms modal context
 */
export function useTermsModal() {
  const context = useContext(TermsModalContext)
  if (context === undefined) {
    throw new Error("useTermsModal must be used within TermsModalProvider")
  }
  return context
}
