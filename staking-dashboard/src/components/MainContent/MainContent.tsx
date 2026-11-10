import { Link, Outlet, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { ProvidersSection } from "./ProvidersSection"
import { WalletConnectGuard } from "@/components/WalletConnectGuard"
import { WalletConnectionAlertModal } from "../WalletConnectionAlert"
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal/TermsAcceptanceModal"
import { useTermsModal } from "@/contexts/TermsModalContext"
import { useConnectedOperatorIdentities } from "@/hooks/operator"
import { POSITIONS_SECTION_ID } from "@/config/links"

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

  const { all: operatorIdentities, isLoading: isLoadingOperator, hasError: operatorDetectionError } = useConnectedOperatorIdentities()
  // When the indexer query fails we can't prove they aren't an operator. Show
  // the tab in that uncertain state so a real operator isn't locked out of
  // the page (where they can retry). False positives for non-operators are
  // fine — they'll see the error banner explaining why the list is empty.
  const isOperator = !isLoadingOperator && (operatorIdentities.length > 0 || operatorDetectionError)

  const getActiveTab = () => {
    if (location.pathname === "/" || location.pathname === "/my-position") return "my-position"
    if (location.pathname === "/stake" || location.pathname === "/providers" || location.pathname.startsWith("/providers/") || location.pathname === "/register-validator") return "stake"
    if (location.pathname === "/operator") return "operator"
    return "my-position"
  }

  const activeTab = getActiveTab()

  const tabs = [
    { id: 'my-position', to: '/', label: 'My Position' },
    { id: 'stake', to: '/stake', label: 'Stake' },
    ...(isOperator ? [{ id: 'operator', to: '/operator', label: 'Operator Tools' }] : []),
  ]

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
    <div className="w-full">
    <div
      className="transition-all duration-700 ease-in-out overflow-hidden"
      style={{
        maxHeight: activeTab === 'my-position' ? '3000px' : '0px',
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
      <div
        ref={tabContainerRef}
        id={POSITIONS_SECTION_ID}
        className={`card-light relative flex flex-col scroll-mt-28 transition-[margin] duration-700 ease-in-out ${activeTab === 'my-position' ? 'mt-8' : ''}`}
      >
        {/* Section tabs: a dark pill with the current view lit in lime */}
        <div className="relative z-20 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="bg-coal inline-flex items-center gap-1 p-1.5 rounded-full">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.to}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`eyebrow px-4 sm:px-5 py-2.5 rounded-full whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? 'bg-chartreuse text-ink'
                    : 'text-parchment/80 hover:text-parchment hover:bg-parchment/10'
                    }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
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