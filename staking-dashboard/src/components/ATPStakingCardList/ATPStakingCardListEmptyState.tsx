/**
 * Empty state component for ATPStakingCardList
 * Displays when no Token Vault positions are available
 */
export const ATPStakingCardListEmptyState = () => {
  return (
    <div className="bg-parchment/5 border border-parchment/20 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-full h-full text-parchment/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="font-md-thermochrome text-xl text-parchment mb-3">
          No Staking Positions Available
        </h3>
        <p className="font-arizona-text text-sm text-parchment/60 mb-6">
          There are currently no Token Vault staking positions available. Please check back later or contact support if you believe this is an error.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-transparent border border-parchment/30 text-parchment px-6 py-3 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/10 transition-all min-h-[44px]"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}