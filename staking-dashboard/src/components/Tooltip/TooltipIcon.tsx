import { Icon } from "@/components/Icon"
import { Tooltip } from "./Tooltip"

export interface TooltipIconProps {
  content: string
  position?: "top" | "bottom" | "left" | "right"
  className?: string
  maxWidth?: string
  size?: "sm" | "md" | "lg"
}

/**
 * Tooltip with consistent question mark icon
 * For inline help explanations
 */
export const TooltipIcon = ({
  content,
  position = "top",
  className = "",
  maxWidth = "max-w-xs",
  size = "sm"
}: TooltipIconProps) => {
  return (
    <Tooltip content={content} position={position} className={className} maxWidth={maxWidth}>
      <div className="inline-flex items-center justify-center text-parchment/60 hover:text-chartreuse transition-colors cursor-help">
        <Icon name="question" size={size} />
      </div>
    </Tooltip>
  )
}