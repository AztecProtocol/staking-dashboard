import { useAlert } from "@/contexts/AlertContext"
import { Icon } from "@/components/Icon"
import { useEffect, useState } from "react"

/**
 * Alert/Toast notification component
 * Displays temporary notifications at the top of the screen
 */
export const Alert = () => {
  const { alerts, dismissAlert } = useAlert()
  const [visibleAlerts, setVisibleAlerts] = useState<Set<string>>(new Set())

  // Trigger animation for new alerts
  useEffect(() => {
    alerts.forEach(alert => {
      if (!visibleAlerts.has(alert.id)) {
        setTimeout(() => {
          setVisibleAlerts(prev => new Set(prev).add(alert.id))
        }, 10)
      }
    })
  }, [alerts, visibleAlerts])

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {alerts.map(alert => {
        const isVisible = visibleAlerts.has(alert.id)
        const colors = {
          success: {
            bg: "bg-chartreuse/10",
            border: "border-chartreuse/30",
            text: "text-chartreuse",
            icon: "check"
          },
          error: {
            bg: "bg-vermillion/10",
            border: "border-vermillion/30",
            text: "text-vermillion",
            icon: "warning"
          },
          warning: {
            bg: "bg-parchment/20",
            border: "border-parchment/40",
            text: "text-parchment",
            icon: "warning"
          },
          info: {
            bg: "bg-aqua/10",
            border: "border-aqua/30",
            text: "text-aqua",
            icon: "info"
          }
        }

        const style = colors[alert.type]

        return (
          <div
            key={alert.id}
            className={`bg-ink border-2 ${style.border} p-4 min-w-[300px] max-w-md shadow-2xl pointer-events-auto transition-all duration-300 ${
              isVisible
                ? 'translate-x-0 opacity-100 scale-100'
                : 'translate-x-full opacity-0 scale-95'
            }`}
            style={{
              animation: isVisible ? 'alertBounce 0.5s ease-out' : 'none'
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`${style.text} flex-shrink-0`}>
                <Icon name={style.icon as any} size="lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-oracle-standard text-sm ${style.text} font-bold`}>
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-parchment hover:text-parchment/60 transition-colors flex-shrink-0"
              >
                <Icon name="x" size="sm" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
