import { useAccount } from "wagmi"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton"
import { Tooltip } from "@/components/Tooltip"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { ClaimDelegationRewardsButton } from "@/components/ClaimDelegationRewardsButton"
import { useWarehouseBalance } from "@/hooks/splits/useWarehouseBalance"
import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useSplitsWarehouse } from "@/hooks/splits/useSplitsWarehouse"
import { calculateTotalUserShareFromSplitRewards, calculateUserShareFromTakeRate } from "@/utils/rewardCalculations"
import type { Address } from "viem"

export interface DelegationModalData {
  splitContract: Address
  providerName: string | null
  providerTakeRate: number
  providerRewardsRecipient: Address
}

interface ClaimDelegationRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  delegation: DelegationModalData
  onSuccess?: () => void
}

/**
 * Modal for claiming delegation rewards
 * Shows split contract (coinbase), checks warehouse balance, and handles distribute + withdraw flow
 */
export const ClaimDelegationRewardsModal = ({
  isOpen,
  onClose,
  delegation,
  onSuccess
}: ClaimDelegationRewardsModalProps) => {
  const { address: beneficiary } = useAccount()
  const { symbol, decimals, stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Get warehouse address from split contract
  const { warehouseAddress } = useSplitsWarehouse(delegation.splitContract)

  // Get rewards balance on rollup (step 1 - needs to be claimed to split contract)
  const {
    rewards: rollupBalance,
    isLoading: isLoadingRollup
  } = useSequencerRewards(delegation.splitContract)

  // Get rewards balance on split contract (step 2 - needs to be distributed)
  const {
    balance: splitContractBalance,
    isLoading: isLoadingSplitContract
  } = useERC20Balance(tokenAddress!, delegation.splitContract)

  // Get rewards balance in warehouse (step 3 - ready to withdraw)
  const {
    balance: warehouseBalance,
    isLoading: isLoadingWarehouse
  } = useWarehouseBalance(warehouseAddress, beneficiary, tokenAddress)

  const isLoadingBalances = isLoadingRollup || isLoadingSplitContract || isLoadingWarehouse

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Calculate user's percentage of rewards
  const userPercentage = ((10000 - delegation.providerTakeRate) / 100).toFixed(2)
  const providerPercentage = (delegation.providerTakeRate / 100).toFixed(2)

  // Calculate user's share from each balance source using shared calculation
  const userShareFromRollup = calculateUserShareFromTakeRate(rollupBalance || 0n, delegation.providerTakeRate)
  const userShareFromSplitContract = calculateUserShareFromTakeRate(splitContractBalance || 0n, delegation.providerTakeRate)

  // Calculate total user's share after claim using shared calculation
  const userShare = calculateTotalUserShareFromSplitRewards(
    rollupBalance || 0n,
    splitContractBalance || 0n,
    warehouseBalance || 0n,
    delegation.providerTakeRate
  )

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
              <Icon name="gift" size="lg" className="text-chartreuse w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-arizona-serif text-2xl font-medium text-parchment mb-2">
                Claim Delegation Rewards
              </h2>
              <p className="text-parchment/80 text-sm leading-relaxed">
                Claim your share of rewards accumulated from delegating to this provider.
              </p>
            </div>
          </div>

          {/* Delegation Details */}
          <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Provider</div>
                <div className="text-parchment font-medium">
                  {delegation.providerName || 'Unknown Provider'}
                </div>
              </div>
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Split Contract (Coinbase)</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-parchment">
                    {delegation.splitContract.slice(0, 10)}...{delegation.splitContract.slice(-8)}
                  </span>
                  <CopyButton text={delegation.splitContract} size="sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Your Share</div>
                  <div className="font-mono text-chartreuse font-bold">
                    {userPercentage}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Provider Share</div>
                  <div className="font-mono text-parchment/60 font-bold">
                    {providerPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Claim Flow Explanation */}
          <div className="bg-chartreuse/10 border border-chartreuse/30 p-4 mb-6">
            <div className="text-xs font-oracle-standard font-bold text-chartreuse mb-2 uppercase tracking-wide">
              Three-Step Claim Process
            </div>
            <div className="space-y-2 text-xs text-parchment/80">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-chartreuse/20 border border-chartreuse flex items-center justify-center">
                  <span className="text-[10px] font-bold text-chartreuse">1</span>
                </div>
                <div>
                  <span className="font-bold text-parchment">Claim:</span> Claim rewards from rollup to split contract
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-chartreuse/20 border border-chartreuse flex items-center justify-center">
                  <span className="text-[10px] font-bold text-chartreuse">2</span>
                </div>
                <div>
                  <span className="font-bold text-parchment">Distribute:</span> Split rewards between you ({userPercentage}%) and provider ({providerPercentage}%)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-chartreuse/20 border border-chartreuse flex items-center justify-center">
                  <span className="text-[10px] font-bold text-chartreuse">3</span>
                </div>
                <div>
                  <span className="font-bold text-parchment">Withdraw:</span> Transfer your share to your wallet
                </div>
              </div>
            </div>
          </div>

          {/* Total You Will Receive */}
          {isLoadingBalances ? (
            <div className="flex items-center gap-2 mb-6 text-sm text-parchment/60">
              <div className="w-3 h-3 border border-parchment/30 border-t-parchment rounded-full animate-spin"></div>
              <span>Checking rewards...</span>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-ink border-2 border-chartreuse p-4 mb-3">
                <div className="text-center">
                  <div className="text-xs font-oracle-standard text-chartreuse uppercase tracking-wide mb-2">
                    Total You Will Receive After Claim
                  </div>
                  <div className="font-mono text-3xl font-bold text-chartreuse">
                    {decimals && symbol ? formatTokenAmount(userShare, decimals, symbol, 2) : '-'}
                  </div>
                  {userShare === 0n && (
                    <p className="text-xs text-parchment/60 mt-2">
                      No rewards available to claim
                    </p>
                  )}
                </div>
              </div>

              {/* Extended Breakdown */}
              <div className="bg-parchment/5 border border-parchment/20 p-4">
                <div className="text-xs font-oracle-standard font-bold text-parchment/80 mb-3 uppercase tracking-wide">
                  Breakdown
                </div>
                <div className="space-y-2 text-xs">
                  {/* Rollup Balance */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-parchment/60">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-chartreuse/20 border border-chartreuse text-[10px] font-bold text-chartreuse mr-1.5">1</span>
                        Rollup Balance
                      </div>
                      <div className={`font-mono font-bold ${userShareFromRollup > 0n ? 'text-parchment' : 'text-parchment/40'}`}>
                        {decimals && symbol ? formatTokenAmount(userShareFromRollup, decimals, symbol, 2) : '-'}
                      </div>
                    </div>
                    <div className="text-[10px] text-parchment/50 ml-6">
                      Your rewards share after commission ({userPercentage}% of {decimals && symbol ? formatTokenAmount(rollupBalance || 0n, decimals, symbol, 2) : '-'})
                    </div>
                  </div>

                  {/* Split Contract Balance */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-parchment/60">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-chartreuse/20 border border-chartreuse text-[10px] font-bold text-chartreuse mr-1.5">2</span>
                        Delegation Rewards
                      </div>
                      <div className={`font-mono font-bold ${userShareFromSplitContract > 0n ? 'text-parchment' : 'text-parchment/40'}`}>
                        {decimals && symbol ? formatTokenAmount(userShareFromSplitContract, decimals, symbol, 2) : '-'}
                      </div>
                    </div>
                    <div className="text-[10px] text-parchment/50 ml-6">
                      Your rewards share after commission ({userPercentage}% of {decimals && symbol ? formatTokenAmount(splitContractBalance || 0n, decimals, symbol, 2) : '-'})
                    </div>
                  </div>

                  {/* Warehouse Balance */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-parchment/60">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-chartreuse/20 border border-chartreuse text-[10px] font-bold text-chartreuse mr-1.5">3</span>
                        Warehouse (Shared)
                      </div>
                      <div className={`font-mono font-bold ${warehouseBalance && warehouseBalance > 0n ? 'text-chartreuse' : 'text-parchment/40'}`}>
                        {decimals && symbol ? formatTokenAmount(warehouseBalance || 0n, decimals, symbol, 2) : '-'}
                      </div>
                    </div>
                    <div className="text-[10px] text-parchment/50 ml-6">
                      Already claimed rewards from all delegations, not withdrawn yet
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-parchment/30 text-parchment font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/10 transition-all"
            >
              Cancel
            </button>
            {userShare === 0n ? (
              <Tooltip content="No rewards available to claim">
                <div>
                  <button
                    disabled
                    className="px-6 py-3 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider transition-all opacity-50 cursor-not-allowed"
                  >
                    Claim Rewards
                  </button>
                </div>
              </Tooltip>
            ) : (
              <ClaimDelegationRewardsButton
                splitContract={delegation.splitContract}
                providerTakeRate={delegation.providerTakeRate}
                providerRewardsRecipient={delegation.providerRewardsRecipient}
                onSuccess={handleSuccess}
                variant="modal"
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
