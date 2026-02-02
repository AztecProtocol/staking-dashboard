import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { useTermsContent } from "@/hooks/useTermsContent"

interface TermsAcceptanceModalProps {
  isOpen: boolean
  onAccept: () => void
  onClose: () => void
}

/**
 * Terms and Conditions acceptance modal
 * Displays before transaction execution to ensure user acceptance
 */
export const TermsAcceptanceModal = ({ isOpen, onAccept, onClose }: TermsAcceptanceModalProps) => {
  const { termsContent, modalIntroText, modalAcceptanceText, helpText } = useTermsContent()

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-sm bg-ink/50 z-50 flex items-center justify-center p-4">
      <div className="bg-ink/95 border border-ink/20 backdrop-blur-sm max-w-4xl w-full max-h-[80vh] flex flex-col relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-parchment/10">
          <h3 className="font-arizona-text text-xl md:text-2xl font-light text-parchment">
            {applyHeroItalics("Terms and Conditions")}
          </h3>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment transition-colors p-2"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Introduction */}
          <div className="mb-6">
            <p className="text-sm text-parchment/80 leading-relaxed">
              {modalIntroText}
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

            {/* Acceptance Section */}
            <div className="border-l-2 border-chartreuse/30 pl-4 mt-6">
              <p className="text-sm text-parchment/80 leading-relaxed">
                {modalAcceptanceText}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 p-6 border-t border-parchment/10">
          <button
            onClick={onAccept}
            className="flex-1 bg-chartreuse text-ink px-6 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all"
          >
            I Accept
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-parchment/10 border border-parchment/30 text-parchment px-6 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
