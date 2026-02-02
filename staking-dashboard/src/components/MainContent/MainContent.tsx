import { Link, Outlet, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { ProvidersSection } from "./ProvidersSection"
import { WalletConnectGuard } from "@/components/WalletConnectGuard"
import { WalletConnectionAlertModal } from "../WalletConnectionAlert"
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal/TermsAcceptanceModal"
import { useTermsModal } from "@/contexts/TermsModalContext"

/**
 * Main content area with tab navigation
 * Handles routing between different staking sections
 */
export const MainContent = () => {
  const location = useLocation()
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const { isTermsModalOpen, closeTermsModal, acceptTerms } = useTermsModal()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [animateContent, setAnimateContent] = useState(false)

  const getActiveTab = () => {
    if (location.pathname === "/" || location.pathname === "/my-position") return "my-position"
    if (location.pathname === "/stake" || location.pathname === "/providers" || location.pathname.startsWith("/providers/") || location.pathname === "/register-validator") return "stake"
    return "my-position"
  }

  const activeTab = getActiveTab()

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      setAnimateContent(true)
      return
    }

    // Trigger content animation on route change
    setAnimateContent(false)
    const animateTimer = setTimeout(() => setAnimateContent(true), 50)

    // If switching to my-position (home), scroll to tab container after delay
    if (activeTab === 'my-position') {
      const scrollTimer = setTimeout(() => {
        if (tabContainerRef.current) {
          const rect = tabContainerRef.current.getBoundingClientRect()
          const absoluteTop = rect.top + window.scrollY
          const headerHeight = 100
          window.scrollTo({
            top: absoluteTop - headerHeight,
            behavior: 'smooth'
          })
        }
      }, 550)
      return () => {
        clearTimeout(animateTimer)
        clearTimeout(scrollTimer)
      }
    } else {
      // Otherwise scroll to below hero
      const heroHeight = 400
      window.scrollTo({
        top: heroHeight,
        behavior: 'smooth'
      })
    }

    return () => {
      clearTimeout(animateTimer)
    }
  }, [location.pathname, activeTab, isInitialLoad])

  return (
    <div className="w-full -mt-20 sm:-mt-24 md:-mt-32">
    <div
      className="transition-all duration-700 ease-in-out overflow-hidden"
      style={{
        maxHeight: activeTab === 'my-position' ? '2000px' : '0px',
        opacity: activeTab === 'my-position' ? 1 : 0,
        transform: activeTab === 'my-position' ? 'translateY(0)' : 'translateY(-100px)',
      }}
    >
      <ProvidersSection />
    </div>

    <WalletConnectGuard
      title="Connect to Stake"
      description="Connect your wallet to stake tokens and manage your positions."
      helpText="After connecting, you'll be able to stake tokens, delegate to providers, and manage your positions."
    >
      <div ref={tabContainerRef} className={`bg-ink/8 border border-ink/20 relative backdrop-blur-sm flex flex-col transition-[margin] duration-700 ease-in-out ${activeTab === 'my-position' ? 'mt-8' : ''}`}>
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


        {/* Sticky Navigation Tabs - Outside scrollable area */}
        <div className={`relative z-20 px-4 sm:px-6 lg:px-10 transition-[padding] duration-700 ease-in-out pt-8 sm:pt-10 lg:pt-12`}>
          <div className="flex border-b border-parchment/10 overflow-x-auto sm:overflow-x-visible">
            <Link
              to="/"
              className={`relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 font-arizona-text text-base sm:text-xl md:text-2xl font-light transition-colors whitespace-nowrap min-h-[48px] sm:min-h-[56px] flex items-center ${activeTab === 'my-position'
                ? 'text-parchment'
                : 'text-parchment/60 hover:text-parchment'
                }`}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-parchment/20"></div>
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-2/3 transition-colors ${activeTab === 'my-position'
                ? 'bg-chartreuse'
                : 'bg-transparent group-hover:bg-parchment/30'
                }`}></div>
              {applyHeroItalics("My Position")}
            </Link>
            <Link
              to="/stake"
              className={`relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 font-arizona-text text-base sm:text-xl md:text-2xl font-light transition-colors whitespace-nowrap min-h-[48px] sm:min-h-[56px] flex items-center ${activeTab === 'stake'
                ? 'text-parchment'
                : 'text-parchment/60 hover:text-parchment'
                }`}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-parchment/20"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-parchment/20"></div>
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-2/3 transition-colors ${activeTab === 'stake'
                ? 'bg-chartreuse'
                : 'bg-transparent group-hover:bg-parchment/30'
                }`}></div>
              {applyHeroItalics("Stake")}
            </Link>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div
          className={`relative z-10 flex-1 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-4 sm:pb-6 lg:pb-10 transition-all duration-500 ease-out ${animateContent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
            }`}
        >
          <Outlet />
        </div>
      </div>
    </WalletConnectGuard>

    {getActiveTab() === 'my-position' && (
      <WalletConnectionAlertModal isSafeWarningShown={false} />
    )}

    {/* Terms Acceptance Modal */}
    <TermsAcceptanceModal
      isOpen={isTermsModalOpen}
      onAccept={acceptTerms}
      onClose={closeTermsModal}
    />
  </div>
  )
};