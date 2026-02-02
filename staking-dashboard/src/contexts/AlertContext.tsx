import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type AlertType = "success" | "error" | "warning" | "info"

export interface Alert {
  id: string
  type: AlertType
  message: string
}

interface AlertContextType {
  alerts: Alert[]
  showAlert: (type: AlertType, message: string) => void
  dismissAlert: (id: string) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

interface AlertProviderProps {
  children: ReactNode
}

/**
 * Provider for managing toast alerts
 * Displays temporary notifications to the user
 */
export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const showAlert = useCallback((type: AlertType, message: string, dismissTime: number = 4000) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    setAlerts(prev => [...prev, { id, type, message }])

    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, dismissTime)
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  return (
    <AlertContext.Provider value={{ alerts, showAlert, dismissAlert }}>
      {children}
    </AlertContext.Provider>
  )
}

/**
 * Hook to access alert context
 */
export function useAlert() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error("useAlert must be used within AlertProvider")
  }
  return context
}
