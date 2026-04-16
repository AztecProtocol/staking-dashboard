import { Link } from "react-router-dom"
import { Icon } from "@/components/Icon"
import { DecentralizationDisclaimer } from "@/components/DecentralizationDisclaimer"
import { IndexerRollupDisclaimer } from "@/components/IndexerRollupDisclaimer"
import { PageHeader } from "@/components/PageHeader"
import { Pagination } from "@/components/Pagination"
import { ProviderSearch } from "@/components/Provider/ProviderSearch"
import { ProviderTable } from "@/components/Provider/ProviderTable"
import { useProviderTable } from "@/hooks/providers/useProviderTable"
import { useProviderTableDisplayData } from "@/hooks/providers/useProviderTableDisplayData"
import { useProviderDisclaimer } from "@/hooks/providers/useProviderDisclaimer"
import { applyHeroItalics } from "@/utils/typographyUtils"

export default function StakingProvidersPage() {
  const {
    providers,
    allProviders,
    currentPage,
    totalPages,
    setCurrentPage,
    searchQuery,
    handleSearchChange,
    sortField,
    sortDirection,
    hasUserSorted,
    handleSort,
    isLoading,
    notAssociatedStake,
    tableTopRef
  } = useProviderTable()

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
    <>
      {/* Back Button */}
      <Link
        to="/stake"
        className="inline-flex mb-4 items-center text-parchment/70 hover:text-parchment transition-colors"
      >
        <Icon name="arrowLeft" size="md" className="mr-2" />
        <span className="font-oracle-standard text-sm">Back to Stake</span>
      </Link>

      <PageHeader
        title={applyHeroItalics("Delegate")}
        description="Stake funds through existing sequencers"
        tooltip="Browse and select from available sequencers to delegate your tokens. Each operator manages sequencer infrastructure while you earn staking rewards. Compare commission rates, performance metrics, and stake distribution before choosing."
      />

      {/* Provider Registration */}
      <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-oracle-standard font-bold text-parchment text-sm mb-1">
              Become a self staker and receive delegation
            </h4>
            <p className="text-parchment/70 text-xs">
              Run sequencer infrastructure and earn commission from delegators
            </p>
          </div>
          <a
            href="https://docs.aztec.network/the_aztec_network/operation/sequencer_management/running_delegated_stake"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-aqua hover:underline font-medium"
          >
            Learn how →
          </a>
        </div>
      </div>

      <ProviderSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <div ref={tableTopRef} className="mb-8">
        <ProviderTable
          providers={providers}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onStakeClick={handleStakeClick}
          isLoading={isLoading}
          myDelegations={myDelegations}
          queueLengths={queueLengths}
          notAssociatedStake={notAssociatedStake}
          providerConfigurations={configurations}
          topGroupSize={topGroupSize}
          showDecentralizationBar={showDecentralizationBar}
          decentralizationBarAfterCount={topGroupSizeThreshold}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={10}
        totalItems={allProviders.length}
      />

      <IndexerRollupDisclaimer />

      {disclaimerProvider && (
        <DecentralizationDisclaimer
          operatorName={disclaimerProvider.name}
          operatorRank={disclaimerProvider.rank}
          onProceed={handleDisclaimerProceed}
          onCancel={handleDisclaimerCancel}
        />
      )}
    </>
  )
}
