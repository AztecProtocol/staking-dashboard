import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"
import {
  useCoinbaseAddresses,
  useAddCoinbaseAddress,
  useMultipleCoinbaseRewards,
  useManualSplitAddresses,
  useAddManualSplit
} from "@/hooks/rewards"
import { AddAddressForm } from "./AddAddressForm"
import { CoinbaseAddressList } from "./CoinbaseAddressList"
import { SplitContractList } from "./SplitContractList"
import { RewardsLockedBanner } from "./RewardsLockedBanner"
import type { Address } from "viem"
import type { SplitContractWithSource } from "./types"

type Tab = "coinbase" | "splits"

interface ManageRewardsAddressesModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal for managing reward tracking addresses
 * Allows users to add/remove coinbase addresses and split contracts
 */
export const ManageRewardsAddressesModal = ({
  isOpen,
  onClose
}: ManageRewardsAddressesModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("coinbase")

  // Token details
  const { symbol, decimals, stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Check if rewards are claimable
  const { isRewardsClaimable } = useIsRewardsClaimable()

  // Coinbase addresses
  const {
    coinbaseAddresses,
    isLoading: isLoadingCoinbaseAddresses,
    refetch: refetchCoinbaseAddresses
  } = useCoinbaseAddresses()

  const addCoinbaseAddress = useAddCoinbaseAddress()

  // Get rewards for all coinbase addresses
  const {
    coinbaseBreakdown,
    isLoading: isLoadingCoinbaseRewards,
    refetch: refetchCoinbaseRewards
  } = useMultipleCoinbaseRewards(coinbaseAddresses as Address[])

  // Manual split addresses
  const {
    splitAddresses,
    isLoading: isLoadingSplitAddresses,
    refetch: refetchSplitAddresses
  } = useManualSplitAddresses()

  const addManualSplit = useAddManualSplit()

  // Get delegation split contracts automatically
  const {
    delegationBreakdown,
    isLoading: isLoadingDelegations
  } = useAggregatedStakingData()

  // Merge delegation splits with manual splits (delegation splits take priority)
  const allSplitContracts = useMemo((): SplitContractWithSource[] => {
    const delegationSplits: SplitContractWithSource[] = delegationBreakdown
      .filter(d => d.splitContract)
      .map(d => ({
        address: d.splitContract as Address,
        source: "delegation" as const,
        providerName: d.providerName,
        providerTakeRate: d.providerTakeRate
      }))

    const delegationAddressesLower = new Set(delegationSplits.map(s => s.address.toLowerCase()))

    // Only include manual splits that aren't already from delegations
    const manualSplits: SplitContractWithSource[] = (splitAddresses as Address[])
      .filter(addr => !delegationAddressesLower.has(addr.toLowerCase()))
      .map(addr => ({
        address: addr,
        source: "manual" as const
      }))

    return [...delegationSplits, ...manualSplits]
  }, [delegationBreakdown, splitAddresses])

  const handleClose = () => {
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleAddCoinbase = async (address: string) => {
    await addCoinbaseAddress.addCoinbaseAddress(address)
    refetchCoinbaseAddresses()
    refetchCoinbaseRewards()
  }

  const handleAddSplit = async (address: string) => {
    await addManualSplit.addManualSplit(address)
    refetchSplitAddresses()
  }

  const handleRefetchCoinbase = () => {
    refetchCoinbaseAddresses()
    refetchCoinbaseRewards()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 backdrop-blur-xs z-[200] flex items-center justify-center p-4 pt-20"
      onClick={handleBackdropClick}
    >
      <div className="bg-ink border-2 border-chartreuse/40 w-full max-w-lg relative max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-parchment/60 hover:text-parchment transition-colors"
        >
          <Icon name="x" size="md" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 mt-1">
              <Icon name="settings" size="lg" className="text-chartreuse w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-arizona-serif text-2xl font-medium text-parchment mb-2">
                Manage Reward Addresses
              </h2>
              <p className="text-parchment/80 text-sm leading-relaxed">
                Add addresses to track sequencer rewards and delegation earnings.
              </p>
            </div>
          </div>

          {/* Rewards Locked Banner */}
          {isRewardsClaimable === false && (
            <RewardsLockedBanner className="mb-6" />
          )}

          {/* Tabs */}
          <div className="flex border-b border-parchment/20 mb-6">
            <button
              onClick={() => setActiveTab("coinbase")}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                activeTab === "coinbase"
                  ? "text-chartreuse border-b-2 border-chartreuse"
                  : "text-parchment/60 hover:text-parchment"
              }`}
            >
              Coinbase Addresses
            </button>
            <button
              onClick={() => setActiveTab("splits")}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                activeTab === "splits"
                  ? "text-chartreuse border-b-2 border-chartreuse"
                  : "text-parchment/60 hover:text-parchment"
              }`}
            >
              Split Contracts
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "coinbase" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-2 font-oracle-standard">
                  Add Coinbase Address
                </div>
                <AddAddressForm
                  placeholder="0x..."
                  onAdd={handleAddCoinbase}
                  isPending={addCoinbaseAddress.isPending}
                  isSuccess={addCoinbaseAddress.isSuccess}
                  isError={addCoinbaseAddress.isError}
                  error={addCoinbaseAddress.error}
                  reset={addCoinbaseAddress.reset}
                />
              </div>

              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-3 font-oracle-standard">
                  Your Coinbase Addresses
                </div>
                <CoinbaseAddressList
                  coinbaseBreakdown={coinbaseBreakdown}
                  decimals={decimals ?? 18}
                  symbol={symbol ?? ""}
                  isRewardsClaimable={isRewardsClaimable ?? false}
                  isLoading={isLoadingCoinbaseAddresses || isLoadingCoinbaseRewards}
                  onRefetch={handleRefetchCoinbase}
                />
              </div>
            </div>
          )}

          {activeTab === "splits" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-2 font-oracle-standard">
                  Add Split Contract
                </div>
                <AddAddressForm
                  placeholder="0x..."
                  onAdd={handleAddSplit}
                  isPending={addManualSplit.isPending}
                  isSuccess={addManualSplit.isSuccess}
                  isError={addManualSplit.isError}
                  error={addManualSplit.error}
                  reset={addManualSplit.reset}
                />
              </div>

              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-3 font-oracle-standard">
                  Your Split Contracts
                </div>
                <SplitContractList
                  splitContracts={allSplitContracts}
                  decimals={decimals ?? 18}
                  symbol={symbol ?? ""}
                  tokenAddress={tokenAddress}
                  isRewardsClaimable={isRewardsClaimable ?? false}
                  isLoading={isLoadingSplitAddresses || isLoadingDelegations}
                  onRefetch={refetchSplitAddresses}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
