import { Outlet } from "react-router-dom"
import { Navbar } from "@/components/Navbar"
import { HeroSection } from "@/components/HeroSection"
import { TransactionCart } from "@/components/TransactionCart"
import { Footer } from "@/components/Footer/Footer"

/**
 * Base layout without provider list sidebar
 * Used for pages that don't need the main content structure (e.g., 404)
 */
export default function BaseLayout() {
  return (
    <div className="bg-cream text-parchment font-body font-smoothing min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 relative isolate flex-1 w-full">
        <div aria-hidden="true" className="page-glow" />
        <Outlet />
      </div>

      <Footer />
      <TransactionCart />
    </div>
  )
}
