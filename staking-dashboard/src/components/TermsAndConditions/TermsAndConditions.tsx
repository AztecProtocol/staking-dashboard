import { useState, useEffect } from "react"
import { useLocation } from "react-router"
import { Icon } from "@/components/Icon"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { useTermsContent } from "@/hooks/useTermsContent"

/**
 * Terms and Conditions component
 * Displays the full T&C text at the bottom of the layout with expand/collapse functionality
 */
export const TermsAndConditions = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { termsContent, introText, helpText } = useTermsContent()
  const location = useLocation()

  // Close T&C when navigating to another page
  useEffect(() => {
    setIsExpanded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div className="bg-ink/8 border border-ink/20 backdrop-blur-sm relative overflow-hidden">
      {/* Background Texture */}
      <div className="pointer-events-none opacity-[0.08] absolute inset-0 z-0">
        <div
          className="absolute inset-0 h-full"
          style={{
            backgroundImage: "url('/assets/Aztec%20Image_28.webp')",
            backgroundPosition: 'center top',
            backgroundRepeat: 'repeat'
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header - Clickable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 lg:px-10 py-6 flex items-center justify-between hover:bg-parchment/5 transition-colors"
        >
          <h3 className="font-arizona-text text-base sm:text-xl md:text-2xl font-light text-parchment">
            {applyHeroItalics("Terms and Conditions")}
          </h3>
          <Icon
            name={isExpanded ? "chevronUp" : "chevronDown"}
            className="text-parchment/60 transition-transform"
            size="md"
          />
        </button>

        {/* Expandable Content */}
        <div
          className={`transition-all duration-300 ease-in-out border-t border-parchment/10 ${
            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="overflow-y-auto custom-scrollbar max-h-[600px] px-6 lg:px-10 py-6">
            <div>
              {/* Introduction */}
              <div className="mb-6">
                <p className="text-sm text-parchment/80 leading-relaxed">
                  {introText}
                </p>
              </div>

              {/* Terms List */}
              <div className="space-y-4">
                {termsContent.map((term, index) => (
                  <div key={index} className="border-l-2 border-parchment/30 pl-4">
                    <h4 className="text-parchment font-oracle-standard font-bold uppercase text-xs tracking-wide mb-2">
                      {term.title}
                    </h4>
                    <div className="text-sm text-parchment/80 leading-relaxed space-y-3">
                      {term.content.split('\n\n').map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          dangerouslySetInnerHTML={{ __html: paragraph }}
                          className="[&_b]:font-bold [&_a]:text-chartreuse [&_a]:underline hover:[&_a]:text-chartreuse/80"
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Help Text */}
                <div className="border-l-2 border-parchment/30 pl-4">
                  <p className="text-sm text-parchment/80 leading-relaxed">
                    {helpText.prefix}
                    <a
                      href={helpText.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-chartreuse hover:text-chartreuse/80 transition-colors underline"
                    >
                      {helpText.link}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
