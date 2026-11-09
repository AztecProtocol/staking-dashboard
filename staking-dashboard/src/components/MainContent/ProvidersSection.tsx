import { ProviderTable } from "@/components/Provider/ProviderTable"
import { ProviderSearch } from "@/components/Provider/ProviderSearch"
import { Pagination } from "@/components/Pagination"
import { DecentralizationDisclaimer } from "@/components/DecentralizationDisclaimer"
import { useProviderTable } from "@/hooks/providers/useProviderTable"
import { useProviderTableDisplayData } from "@/hooks/providers/useProviderTableDisplayData"
import { useProviderDisclaimer } from "@/hooks/providers/useProviderDisclaimer"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { useAccount } from "wagmi"

/**
 * Providers section component
 * Displays staking providers with search and pagination
 */
export const ProvidersSection = () => {
  const {
    providers,
    allProviders,
    isLoading: isLoadingProviders,
    sortField,
    sortDirection,
    hasUserSorted,
    handleSort,
    searchQuery,
    handleSearchChange,
    currentPage,
    totalPages,
    setCurrentPage,
    notAssociatedStake,
    tableTopRef
  } = useProviderTable()

  const { isConnected } = useAccount()

  const {
    disclaimerProvider,
    handleStakeClick,
    handleDisclaimerProceed,
    handleDisclaimerCancel
  } = useProviderDisclaimer(allProviders)

  const {
    myDelegations,
    queueLengths,
    configurations,
    topGroupSize,
    showDecentralizationBar,
    topGroupSizeThreshold,
  } = useProviderTableDisplayData({
    providers,
    sortField,
    sortDirection,
    currentPage,
    searchQuery,
    hasUserSorted,
  })

  return (
    <div className="relative z-20 mb-0 opacity-0 animate-fade-up" style={{ animationDelay: '200ms' }}>

      <div className="relative z-10 pb-4 sm:pb-6 lg:pb-10">
        {/* Providers: heading, search and table share one dark card */}
        <div className="card-dark relative px-4 sm:px-7 lg:px-9 pt-8 sm:pt-10 pb-5 sm:pb-6 mb-14 sm:mb-20">
          <div className="pb-7 sm:pb-9">
            <p className="eyebrow text-accent mb-3">Delegate your stake</p>
            <h2 className="font-arizona-serif font-light text-4xl sm:text-5xl lg:text-6xl leading-none tracking-tight-5 text-parchment">
              {applyHeroItalics("Providers")}
            </h2>
          </div>

          {/* Search Bar */}
          <ProviderSearch
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />

          {/* Table */}
          <div ref={tableTopRef} className="-mx-2 sm:-mx-3 mb-4 scroll-mt-28">
            <ProviderTable
              providers={providers}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onStakeClick={handleStakeClick}
              isLoading={isLoadingProviders}
              myDelegations={myDelegations}
              queueLengths={queueLengths}
              notAssociatedStake={notAssociatedStake}
              providerConfigurations={configurations}
              topGroupSize={topGroupSize}
              showDecentralizationBar={showDecentralizationBar}
              decentralizationBarAfterCount={topGroupSizeThreshold}
            />
          </div>

          {/* Pagination */}
          <div className="border-t border-parchment/10 pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={10}
              totalItems={allProviders.length}
            />
          </div>
        </div>

        {/* Bridge to the positions below. Without a wallet there are no positions,
            and the connect prompt that follows this section speaks for itself. */}
        {isConnected && (
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="font-arizona-serif font-light text-3xl sm:text-4xl lg:text-5xl leading-none tracking-tight-5 text-parchment mb-4">
              {applyHeroItalics("Manage Your Stakes")}
            </h3>
            <p className="font-oracle-standard text-parchment/70 text-base sm:text-lg leading-snug">
              Track your active positions, monitor rewards, and manage your staking portfolio below
            </p>
          </div>
        )}
      </div>

      {disclaimerProvider && (
        <DecentralizationDisclaimer
          operatorName={disclaimerProvider.name}
          operatorRank={disclaimerProvider.rank}
          onProceed={handleDisclaimerProceed}
          onCancel={handleDisclaimerCancel}
        />
      )}
    </div>
  )
}
