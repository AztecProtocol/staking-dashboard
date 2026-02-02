import { Link } from "react-router-dom"
import { Icon } from "@/components/Icon"
import { applyHeroItalics } from "@/utils/typographyUtils"

/**
 * 404 Not Found page
 * Displays when user navigates to a route that doesn't exist
 */
export const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 -mt-32">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Icon */}
        <div className="mb-4">
          <Icon name="warning" className="w-20 h-20 mx-auto text-parchment/40" />
        </div>

        {/* Title */}
        <h1 className="font-arizona-text text-2xl md:text-3xl text-parchment/80 mb-3">
          {applyHeroItalics("Page Not Found")}
        </h1>

        {/* Description */}
        <p className="font-md-thermochrome text-base md:text-lg text-parchment/60 mb-6 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 bg-chartreuse text-ink px-6 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all"
        >
          <Icon name="arrowLeft" size="sm" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
