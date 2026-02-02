import { useMemo, useState } from "react"
import { ATPStakingCard } from "../ATPStakingCard/ATPStakingCard"
import { Pagination } from "../Pagination/Pagination"
import { ATPStakingCardListLoadingState } from "./ATPStakingCardListLoadingState"
import { ATPStakingCardListEmptyState } from "./ATPStakingCardListEmptyState"
import { useMultipleStakeableAmounts } from "@/hooks/atp/useMultipleStakeableAmounts"
import { useATP } from "@/hooks/useATP"
import type { ATPData } from "@/hooks/atp"

interface ATPStakingCardListProps {
  onStakeClick: (atp: ATPData) => void
}

/**
 * Displays available Token Vaults with pagination
 * Manages its own pagination state and data fetching internally
 */
export const ATPStakingCardList = ({
  onStakeClick
}: ATPStakingCardListProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4 // Show 4 ATP cards per page (2x2 grid)

  // Get ATP data from context
  const { atpData, isLoadingAtpData, isLoadingAtpHoldings } = useATP()

  // Get stakeable amounts for all ATPs
  const { atpStakeableData, isLoading: isLoadingStakeable, refetch: refetchStakeableAmounts } = useMultipleStakeableAmounts(atpData || [])

  // Sort ATPs by total funds (descending)
  const sortedAtpData = useMemo(() => {
    return [...atpStakeableData].sort((a, b) => {
      const totalA = a.allocation || 0n
      const totalB = b.allocation || 0n
      // Sort descending (largest total funds first)
      return totalA > totalB ? -1 : totalA < totalB ? 1 : 0
    })
  }, [atpStakeableData])

  // Early returns after all hooks
  if (isLoadingAtpData || isLoadingStakeable || isLoadingAtpHoldings) {
    return <ATPStakingCardListLoadingState itemsPerPage={itemsPerPage} />
  }

  if (!atpData || atpData.length === 0) {
    return <ATPStakingCardListEmptyState />
  }

  // Calculate pagination
  const totalItems = sortedAtpData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedAtpData.slice(startIndex, endIndex)

  // List of ATP cards in responsive grid with pagination
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {paginatedData.map((atp) => (
          <ATPStakingCard
            key={atp.atpAddress}
            data={atp}
            stakeableAmount={atp.stakeableAmount}
            isStakeable={atp.isStakeable}
            onStakeClick={(atp) => onStakeClick(atp)}
            onClaimSuccess={refetchStakeableAmounts}
          />
        ))}
      </div>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          className="pt-4 border-t border-parchment/10"
        />
      )}
    </div>
  )
}