import { Link } from "react-router-dom"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string | ReactNode
  description: string | ReactNode
  backTo?: string
  backLabel?: string
  tooltip?: string
}

/**
 * Shared page header component with back button, title, and description
 * Used across multiple pages for consistent header styling
 */
export const PageHeader = ({
  title,
  description,
  backTo,
  backLabel = "Back",
  tooltip
}: PageHeaderProps) => {
  return (
    <div className="mb-6">
      {/* Back Button */}
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex mb-4 items-center text-parchment/70 hover:text-parchment transition-colors"
        >
          <Icon name="arrowLeft" size="md" className="mr-2" />
          <span className="font-oracle-standard text-sm">{backLabel}</span>
        </Link>
      )}

      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-0">
          <h3 className="font-arizona-serif text-2xl font-medium">
            {title}
          </h3>
          {tooltip && (
            <TooltipIcon
              content={tooltip}
              maxWidth="max-w-md"
            />
          )}
        </div>
        <div className="font-arizona-text text-parchment/70 font-light">
          {description}
        </div>
      </div>
    </div>
  )
}