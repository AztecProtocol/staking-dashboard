import { Navbar } from "@/components/Navbar"
import { HeroSection } from "@/components/HeroSection"
import { MainContent } from "@/components/MainContent"
import { TransactionCart } from "@/components/TransactionCart"
import { Footer } from "@/components/Footer/Footer"

export default function SharedLayout() {
  return (
    <div className="bg-ink text-parchment font-body font-smoothing min-h-screen">
      <Navbar />
      <HeroSection />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 pb-16 relative flex-1">
        <MainContent />
      </div>

      <Footer />
      <TransactionCart />
    </div>
  )
}