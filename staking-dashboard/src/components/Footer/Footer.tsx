import { useState } from "react"
import { StakingTermsModal } from "./StakingTermsModal"

/**
 * Footer component with legal links
 * Displays at the bottom of all pages
 */
export const Footer = () => {
  const [isStakingTermsOpen, setIsStakingTermsOpen] = useState(false)

  return (
    <>
      <footer className="border-t border-parchment/10 bg-ink/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Legal Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 font-md-thermochrome text-sm text-parchment/60">
            <button
              onClick={() => setIsStakingTermsOpen(true)}
              className="hover:text-parchment transition-colors underline"
            >
              Staking Terms & Conditions
            </button>
            <a
              href="https://aztec.network/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-parchment transition-colors underline"
            >
              Terms of Service
            </a>
            <a
              href="https://aztec.network/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-parchment transition-colors underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://aztec.network/token-sale-disclaimer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-parchment transition-colors underline"
            >
              Token Sale Disclaimer
            </a>
          </div>

          {/* Divider */}
          <div className="h-px bg-parchment/10 mb-6"></div>

          {/* Copyright and UK Notice */}
          <div className="space-y-4">
            <p className="font-md-thermochrome text-sm text-parchment/60">
              © 2025 Aztec Foundation
            </p>
            <p className="font-md-thermochrome text-xs text-parchment/50 max-w-4xl leading-relaxed">
              <span className="font-semibold">Information for Persons in the UK:</span> Communications relating to the Aztec token and the Aztec token sale made by Aztec Foundation are directed only at persons outside the UK. Persons in the UK are not permitted to participate in the Aztec token sale and must not act upon any communications made by Aztec Foundation in relation to it or the Aztec token.
            </p>
          </div>
        </div>
      </footer>

      <StakingTermsModal
        isOpen={isStakingTermsOpen}
        onClose={() => setIsStakingTermsOpen(false)}
      />
    </>
  )
}
