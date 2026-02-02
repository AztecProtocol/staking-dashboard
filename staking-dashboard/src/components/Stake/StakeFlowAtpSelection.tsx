import { useState, useEffect, useMemo, useCallback } from "react"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"
import { useATP } from "@/hooks/useATP"
import { useMultipleStakeableAmounts } from "@/hooks/atp/useMultipleStakeableAmounts"
import { useActivationThresholdFormatted } from "@/hooks/rollup"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { ATPStakingStepsWithTransaction, useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { AtpCard, PaginationControls } from "./AtpSelection"
import { StakeFlowCountModal } from "./StakeFlowCountModal"
import type { ATPData } from "@/hooks"

interface StakeFlowAtpSelectionProps {
  columns?: 1 | 2 | 3
  itemsPerPage?: number
}

/**
 * ATP holdings selection step component for validator registration
 * Shows all ATP holdings from the connected wallet for staking selection
 * Uses ATPStakingStepsContext for state management
 */
export const StakeFlowAtpSelection = ({ columns = 3, itemsPerPage: customItemsPerPage }: StakeFlowAtpSelectionProps) => {
  const { formData, updateFormData, handleNextStep, currentStep, setStepValid, canContinue } = useATPStakingStepsContext()
  const { selectedAtp, stakeCount, transactionType } = formData
  const { transactions } = useTransactionCart()

  const { atpData, isLoadingAtpHoldings, isLoadingAtpData, atpError } = useATP()

  const { stakeableAtps, isLoading: isLoadingStakeable } = useMultipleStakeableAmounts(atpData)

  const { formattedThreshold } = useActivationThresholdFormatted()
  const { activationThreshold } = useRollupData()

  const [currentPage, setCurrentPage] = useState(1)
  const [firstNavigated, setFirstNavigated] = useState(false)
  const [isCountModalOpen, setIsCountModalOpen] = useState(true)

  const itemsPerPage = customItemsPerPage ?? (columns === 1 ? 3 : columns === 2 ? 4 : 6)

  const isLoading = isLoadingAtpHoldings || isLoadingAtpData || isLoadingStakeable
  const isError = !!atpError
  const error = atpError instanceof Error ? atpError.message : String(atpError)

  // Calculate required amount based on stake count
  const requiredAmount = useMemo(() => {
    if (!activationThreshold) return 0n
    return activationThreshold * BigInt(stakeCount)
  }, [activationThreshold, stakeCount])

  // Find the maximum stakeable amount across all ATPs for StakeFlowCountModal
  const maxStakeableAmount = useMemo(() => {
    if (stakeableAtps.length === 0) return 0n
    return stakeableAtps.reduce((max, atp) =>
      atp.stakeableAmount > max ? atp.stakeableAmount : max
      , 0n)
  }, [stakeableAtps])

  // Calculate maximum number of stakes from the largest ATP
  const maxStakesFromLargestAtp = useMemo(() => {
    if (!activationThreshold || maxStakeableAmount === 0n) return 0
    return Number(maxStakeableAmount / activationThreshold)
  }, [maxStakeableAmount, activationThreshold])

  // Update formData with maxStakesFromLargestAtp 
  // use formData.maxStakesCount if already set by parent flow 
  // e.g: providerQueueLength for delegation
  useEffect(() => {
    const effectiveMaxCount = formData.maxStakesCount
      ? Math.min(formData.maxStakesCount, maxStakesFromLargestAtp)
      : maxStakesFromLargestAtp

    if (effectiveMaxCount !== formData.maxStakesCount) {
      updateFormData({ maxStakesCount: effectiveMaxCount })
    }
  }, [maxStakesFromLargestAtp, formData.maxStakesCount])

  // Get stakeCount from transaction cart based on stakeCount token approval (if there's any)
  // so if the user reload the pages, and pending tx's is waiting for them, they dont have to select stake count again
  useEffect(() => {
    if (!selectedAtp) {
      return
    }

    const stakeCountFromTokenApprovalTx = transactions.filter(tx =>
      tx.type === transactionType &&
      tx.metadata?.stepType === ATPStakingStepsWithTransaction.TokenApproval &&
      tx.metadata?.atpAddress === selectedAtp.atpAddress &&
      tx.metadata?.stakeCount
    )

    if (stakeCountFromTokenApprovalTx.length && stakeCountFromTokenApprovalTx[0].metadata?.stakeCount) {
      updateFormData({ stakeCount: stakeCountFromTokenApprovalTx[0].metadata?.stakeCount })
      setIsCountModalOpen(false)
    }
  }, [transactions, selectedAtp, updateFormData])

  // Sort and filter stakeable ATPs by total funds (desc) and required amount
  const sortedStakeableAtps = useMemo(() => {
    const filtered = stakeableAtps.filter(atp => {
      return atp.stakeableAmount >= requiredAmount
    })

    return filtered.sort((a, b) => {
      const totalAllocationA = a.allocation || 0n
      const totalAllocationB = b.allocation || 0n
      return totalAllocationB > totalAllocationA ? 1 : totalAllocationB < totalAllocationA ? -1 : 0
    })
  }, [stakeableAtps, requiredAmount])


  const hasPendingTransactionsForAtp = useCallback((atp: ATPData) => {
    return transactions.some(tx =>
      tx.status === 'pending' &&
      tx.metadata?.atpAddress === atp.atpAddress &&
      tx.type === transactionType
    )
  }, [transactions])

  // Check if the currently selected ATP has pending transactions
  const hasPendingTransactionsForSelectedAtp = useMemo(() => {
    if (!selectedAtp) return false
    return hasPendingTransactionsForAtp(selectedAtp)
  }, [selectedAtp, hasPendingTransactionsForAtp])

  const handleAtpSelection = (atp: typeof stakeableAtps[0]) => {
    // If trying to select a different ATP and there are pending transactions for currently selected ATP
    if (selectedAtp && selectedAtp.atpAddress !== atp.atpAddress && hasPendingTransactionsForSelectedAtp) {
      // Don't allow selection, user needs to complete pending transactions first
      return
    }
    updateFormData({ selectedAtp: atp })
  }

  const totalItems = sortedStakeableAtps.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedStakeableAtps.slice(startIndex, endIndex)

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [sortedStakeableAtps.length])

  // Auto-select ATP with pending transactions if no ATP is selected
  useEffect(() => {
    if (!selectedAtp && sortedStakeableAtps.length > 0) {
      const atpWithPendingTx = sortedStakeableAtps.find(atp => hasPendingTransactionsForAtp(atp))
      if (atpWithPendingTx && atpWithPendingTx.allocation) {
        updateFormData({ selectedAtp: atpWithPendingTx })
      }
    }
  }, [selectedAtp, sortedStakeableAtps, hasPendingTransactionsForAtp, updateFormData])

  // Navigate to the page containing the selected ATP
  useEffect(() => {
    if (selectedAtp && sortedStakeableAtps.length > 0 && !firstNavigated) {
      const atpIndex = sortedStakeableAtps.findIndex(
        atp => atp.atpAddress === selectedAtp.atpAddress
      )
      if (atpIndex !== -1) {
        const pageContainingAtp = Math.floor(atpIndex / itemsPerPage) + 1
        setCurrentPage(pageContainingAtp)
        setFirstNavigated(true)
      }
    }
  }, [selectedAtp, sortedStakeableAtps, itemsPerPage])

  // Auto navigate to next page if the step valid
  useEffect(() => {
    setStepValid(currentStep, selectedAtp !== null && !!stakeCount && !isCountModalOpen)
  }, [selectedAtp, stakeCount, isCountModalOpen, currentStep, setStepValid])

  const handleConfirmCount = (count: number) => {
    updateFormData({ stakeCount: count })
    setIsCountModalOpen(false)
  }
  const handleAdjustCount = () => setIsCountModalOpen(true)

  const handlePrevPage = () => setCurrentPage(Math.max(1, currentPage - 1))
  const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1))
  const handlePageSelect = (page: number) => setCurrentPage(page)

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, currentPage + 1)

    // Always show first page if not in range
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }

    // Show current range
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Always show last page if not in range
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-2 mb-3 mt-6">
          <label className="font-oracle-standard text-label uppercase tracking-wide-8 text-parchment/90 font-medium">
            Select Token Vault to Stake
          </label>
        </div>
        <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-3 sm:gap-4`}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div
              key={index}
              className="bg-parchment/5 border border-parchment/20 p-4 animate-pulse"
            >
              <div className="h-4 bg-parchment/20 rounded w-2/3 mb-3"></div>
              <div className="h-6 bg-parchment/20 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-parchment/20 rounded w-full"></div>
                <div className="h-3 bg-parchment/20 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || atpData.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-2 mb-3 mt-6">
          <label className="font-md-thermochrome text-label uppercase tracking-wide-8 text-parchment/90 font-medium">
            Select Token Vault to Stake
          </label>
          <TooltipIcon
            content="Select a Token Vault from your holdings to stake as a sequencer."
            maxWidth="max-w-sm"
          />
        </div>
        <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-8 text-center">
          <div className="text-parchment/60 mb-4">
            {isError ? `Error: ${error}` : "No Token Vault holdings found"}
          </div>
          <p className="text-xs text-parchment/50">
            {isError
              ? "Please try again or check your connection"
              : "You need to have Token Vaults to register as a validator"
            }
          </p>
        </div>
      </div>
    )
  }

  if (stakeableAtps.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-2 mb-3 mt-6">
          <label className="font-oracle-standard text-label uppercase tracking-wide-8 text-parchment/90 font-medium">
            Select Token Vault to Stake
          </label>
          <TooltipIcon
            content="Select a Token Vault from your holdings to stake as a sequencer."
            maxWidth="max-w-sm"
          />
        </div>
        <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-parchment/20 text-parchment/60 rounded-full">
            <Icon name="x" className="w-6 h-6" />
          </div>
          <div className="text-parchment/60 mb-4">
            No available balance to stake
          </div>
          <p className="text-xs text-parchment/50">
            Your Token Vaults do not have sufficient available balance. A minimum of <span className="font-mono text-chartreuse">{formattedThreshold}</span> is required per sequencer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <StakeFlowCountModal
        isOpen={isCountModalOpen}
        onClose={() => setIsCountModalOpen(false)}
        onConfirm={handleConfirmCount}
      />

      <div className="flex items-center justify-between gap-2 mb-3 mt-6">
        <div className="flex items-center gap-2">
          <label className="font-oracle-standard text-label uppercase tracking-wide-8 text-parchment/90 font-medium">
            Select Token Vault to Stake
          </label>
          <TooltipIcon
            content="Choose which Token Vault you want to stake as a sequencer."
            maxWidth="max-w-sm"
          />
        </div>

        {/* Stake count badge with adjust button */}
        <button
          onClick={handleAdjustCount}
          className="flex items-center gap-2 px-3 py-1.5 bg-chartreuse/10 border border-chartreuse/30 hover:bg-chartreuse/20 transition-colors"
        >
          <span className="text-xs font-oracle-standard font-bold uppercase tracking-wide text-chartreuse">
            {stakeCount} {formData.transactionType === "delegation" ? "Delegation" : "Stake"}{stakeCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs font-oracle-standard uppercase tracking-wide text-parchment/60">
            Change
          </span>
        </button>
      </div>

      {/* Pending Transactions Warning */}
      {hasPendingTransactionsForSelectedAtp && (
        <div className="border-2 border-aqua/40 bg-aqua/10 p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" size="lg" className="text-aqua flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-oracle-standard font-bold text-aqua uppercase tracking-wide mb-2">
                Pending Transactions
              </p>
              <p className="text-sm text-parchment/90 leading-relaxed">
                You have pending transactions for this Token Vault. Please complete or remove all pending transactions before selecting a different Token Vault.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Staking Rules Notice */}
      <div className="border border-parchment/20 bg-parchment/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="info" size="md" className="text-parchment/60 flex-shrink-0" />
          <p className="text-sm font-oracle-standard font-bold text-parchment">Staking Requirements</p>
        </div>
        <ul className="space-y-1.5 text-sm text-parchment/70 ml-7 list-disc">
          <li>Requires exactly <span className="font-mono text-chartreuse">{formattedThreshold}</span> per sequencer</li>
          <li>One Token Vault at a time</li>
          <li>Multiple transactions needed for additional stakes</li>
          <li>Minimum <span className="font-mono text-chartreuse">{formattedThreshold}</span> required</li>
        </ul>
      </div>

      <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-3 sm:gap-4`}>
        {paginatedData.map((atp) => {
          const isSelected = selectedAtp?.atpAddress === atp.atpAddress
          const isDisabled = !isSelected && hasPendingTransactionsForSelectedAtp

          return (
            <AtpCard
              key={atp.atpAddress}
              atp={atp}
              isSelected={isSelected}
              onSelect={() => handleAtpSelection(atp)}
              disabled={isDisabled}
            />
          )
        })}
      </div>

      {sortedStakeableAtps.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onPageSelect={handlePageSelect}
          getVisiblePages={getVisiblePages}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
        <button
          type="button"
          className="flex-1 bg-chartreuse text-ink py-3 px-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextStep}
          disabled={!canContinue()}
        >
          Continue
        </button>
      </div>
    </div>
  )
}