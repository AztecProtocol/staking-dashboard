import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { ATPData } from "@/hooks/atp"

export type SelectionType = "delegation" | "self-stake"

interface ATPSelectionContextType {
  selectedAtp: ATPData | null
  selectionType: SelectionType | null
  setSelectedAtp: (atp: ATPData | null, type?: SelectionType | null) => void
  clearSelectedAtp: () => void
}

const ATPSelectionContext = createContext<ATPSelectionContextType | undefined>(undefined)

interface ATPSelectionProviderProps {
  children: ReactNode
}

/**
 * Provider for managing ATP selection across navigation
 * Used to persist ATP selection from Staking Choice Modal to flows
 */
export function ATPSelectionProvider({ children }: ATPSelectionProviderProps) {
  const [selectedAtp, setSelectedAtpState] = useState<ATPData | null>(null)
  const [selectionType, setSelectionType] = useState<SelectionType | null>(null)

  const setSelectedAtp = useCallback((atp: ATPData | null, type: SelectionType | null = null) => {
    setSelectedAtpState(atp)
    setSelectionType(type)
  }, [])

  const clearSelectedAtp = useCallback(() => {
    setSelectedAtpState(null)
    setSelectionType(null)
  }, [])

  return (
    <ATPSelectionContext.Provider value={{ selectedAtp, selectionType, setSelectedAtp, clearSelectedAtp }}>
      {children}
    </ATPSelectionContext.Provider>
  )
}

/**
 * Hook to access ATP selection context
 */
export function useATPSelection() {
  const context = useContext(ATPSelectionContext)
  if (context === undefined) {
    throw new Error("useATPSelection must be used within ATPSelectionProvider")
  }
  return context
}
