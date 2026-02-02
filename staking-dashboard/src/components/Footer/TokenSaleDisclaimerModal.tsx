import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { applyHeroItalics } from "@/utils/typographyUtils"

interface TokenSaleDisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Token Sale Disclaimer modal
 */
export const TokenSaleDisclaimerModal = ({ isOpen, onClose }: TokenSaleDisclaimerModalProps) => {
  if (!isOpen) return null

  const disclaimerContent = `This website and the information contained herein is not intended to be a source of advice or credit analysis with respect to the material presented, and the information and/or documents contained in this website do not constitute investment advice.

The Aztec Foundation does not make any representation or warranty, express or implied, as to the accuracy or completeness of the information contained herein and nothing contained herein should be relied upon as a promise or representation as to the future.

AZTEC tokens are not being offered or distributed to, as well as cannot be resold or otherwise alienated by their holders to, citizens of, natural and legal persons, having their habitual residence, location or their seat of incorporation in the country or territory where transactions with digital tokens are prohibited or in any manner restricted by applicable laws or regulations.

If such restricted person purchases AZTEC tokens, such restricted person has done so on an unlawful, unauthorized and fraudulent basis and in this regard shall bear negative consequences.`

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-sm bg-ink/50 z-50 flex items-center justify-center p-4">
      <div className="bg-ink/95 border border-ink/20 backdrop-blur-sm max-w-3xl w-full max-h-[80vh] flex flex-col relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-parchment/10">
          <h3 className="font-arizona-text text-xl md:text-2xl font-light text-parchment">
            {applyHeroItalics("Token Sale Disclaimer")}
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
          <div className="space-y-4 text-sm text-parchment/80 leading-relaxed">
            {disclaimerContent.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-parchment/10">
          <button
            onClick={onClose}
            className="bg-chartreuse text-ink px-6 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
