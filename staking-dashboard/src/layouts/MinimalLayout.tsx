import { Outlet } from "react-router-dom"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer/Footer"
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal/TermsAcceptanceModal"
import { useTermsModal } from "@/contexts/TermsModalContext"

/**
 * Minimal layout with only Navbar and Footer
 * Used for standalone pages like Governance that don't need HeroSection or Providers
 */
export default function MinimalLayout() {
  const { isTermsModalOpen, closeTermsModal, acceptTerms } = useTermsModal()

  return (
    <div className="bg-cream text-parchment font-body font-smoothing min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative isolate flex-1 w-full pt-32">
        <div aria-hidden="true" className="page-glow" />
        <Outlet />
      </div>

      <Footer />

      {/* Terms Acceptance Modal - required for transactions */}
      <TermsAcceptanceModal
        isOpen={isTermsModalOpen}
        onAccept={acceptTerms}
        onClose={closeTermsModal}
      />
    </div>
  )
}
