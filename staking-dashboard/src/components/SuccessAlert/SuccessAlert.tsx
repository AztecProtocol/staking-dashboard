import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import type { ReactNode } from "react"

interface SuccessAlertProps {
  isOpen: boolean
  title: string
  message: ReactNode
  onClose: () => void
}

/**
 * Success alert modal component
 */
export const SuccessAlert = ({ isOpen, title, message, onClose }: SuccessAlertProps) => {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 modal-scrim z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="card-dark max-w-md w-full p-8 relative overflow-hidden">
        {/* Success Icon */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-20 h-20 bg-parchment/5 border border-parchment/20 flex items-center justify-center rounded-inset">
            <Icon name="check" className="w-10 h-10 text-accent" />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-arizona-serif text-2xl text-accent text-center mb-4 relative z-10">
          {title}
        </h3>

        {/* Message */}
        <div className="text-sm text-parchment/80 font-oracle-standard text-center mb-8 leading-relaxed relative z-10">
          {message}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full btn-lime py-3 px-6 text-xs relative z-10"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  )
}
