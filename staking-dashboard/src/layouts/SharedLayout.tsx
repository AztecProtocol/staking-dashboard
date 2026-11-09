import { Navbar } from "@/components/Navbar"
import { HeroSection } from "@/components/HeroSection"
import { MainContent } from "@/components/MainContent"
import { TransactionCart } from "@/components/TransactionCart"
import { Footer } from "@/components/Footer/Footer"

export default function SharedLayout() {
  return (
    <div className="bg-cream text-parchment font-body font-smoothing min-h-screen">
      <Navbar />
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 relative isolate flex-1">
        <div aria-hidden="true" className="page-glow" />
        <MainContent />
      </div>

      <Footer />
      <TransactionCart />
    </div>
  )
}