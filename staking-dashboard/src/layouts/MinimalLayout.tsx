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
    <div className="bg-ink text-parchment font-body font-smoothing min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 pb-16 flex-1 w-full pt-32">
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
