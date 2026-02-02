import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

export interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
  className?: string
  maxWidth?: string
}

/**
 * Tooltip component with Aztec theme styling
 * Provides contextual help and explanations
 */
export const Tooltip = ({
  content,
  children,
  position = "top",
  className = "",
  maxWidth = "max-w-xs"
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [actualPosition, setActualPosition] = useState(position)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    let x = 0
    let y = 0
    let finalPosition = position

    // Use viewport coordinates for fixed positioning
    const triggerViewport = {
      left: triggerRect.left,
      top: triggerRect.top,
      right: triggerRect.right,
      bottom: triggerRect.bottom,
      width: triggerRect.width,
      height: triggerRect.height
    }

    // Auto-detect best position based on available space in viewport
    const spaceTop = triggerRect.top
    const spaceBottom = window.innerHeight - triggerRect.bottom
    const spaceLeft = triggerRect.left
    const spaceRight = window.innerWidth - triggerRect.right

    // Determine best position
    if (position === "top" && spaceTop < tooltipRect.height + 16) {
      finalPosition = spaceBottom > tooltipRect.height + 16 ? "bottom" : spaceRight > tooltipRect.width + 16 ? "right" : "bottom"
    } else if (position === "bottom" && spaceBottom < tooltipRect.height + 16) {
      finalPosition = spaceTop > tooltipRect.height + 16 ? "top" : spaceRight > tooltipRect.width + 16 ? "right" : "top"
    } else if (position === "left" && spaceLeft < tooltipRect.width + 16) {
      finalPosition = spaceRight > tooltipRect.width + 16 ? "right" : spaceBottom > tooltipRect.height + 16 ? "bottom" : "right"
    } else if (position === "right" && spaceRight < tooltipRect.width + 16) {
      finalPosition = spaceLeft > tooltipRect.width + 16 ? "left" : spaceBottom > tooltipRect.height + 16 ? "bottom" : "left"
    }

    setActualPosition(finalPosition)

    // Calculate position based on final position choice (viewport coordinates for fixed positioning)
    switch (finalPosition) {
      case "top":
        x = triggerViewport.left + (triggerViewport.width / 2) - (tooltipRect.width / 2)
        y = triggerViewport.top - tooltipRect.height - 8
        break
      case "bottom":
        x = triggerViewport.left + (triggerViewport.width / 2) - (tooltipRect.width / 2)
        y = triggerViewport.bottom + 8
        break
      case "left":
        x = triggerViewport.left - tooltipRect.width - 8
        y = triggerViewport.top + (triggerViewport.height / 2) - (tooltipRect.height / 2)
        break
      case "right":
        x = triggerViewport.right + 8
        y = triggerViewport.top + (triggerViewport.height / 2) - (tooltipRect.height / 2)
        break
    }

    // Ensure tooltip stays within viewport bounds
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    x = Math.max(8, Math.min(x, viewportWidth - tooltipRect.width - 8))
    y = Math.max(8, Math.min(y, viewportHeight - tooltipRect.height - 8))

    setTooltipPosition({ x, y })
  }

  useEffect(() => {
    if (isVisible) {
      // Use a small delay to ensure tooltip is rendered and has dimensions
      const timer = setTimeout(() => {
        updatePosition()
      }, 10)

      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isVisible, position])

  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0"

    switch (actualPosition) {
      case "top":
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-ink`
      case "bottom":
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-ink`
      case "left":
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-ink`
      case "right":
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-ink`
      default:
        return ""
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block cursor-help ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] ${maxWidth} pointer-events-none transition-opacity duration-200`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            opacity: tooltipPosition.x === 0 && tooltipPosition.y === 0 ? 0 : 1
          }}
        >
          <div className="relative bg-ink border border-parchment/30 p-3 shadow-lg backdrop-blur-sm">
            <div className="font-oracle-standard text-sm text-parchment leading-relaxed">
              {content}
            </div>
            <div className={getArrowClasses()}></div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}