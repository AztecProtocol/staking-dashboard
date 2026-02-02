import { useState } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { ClaimAllProvider } from "@/contexts/ClaimAllContext"
import { ClaimAllDelegationRewardsButton } from "@/components/ClaimAllDelegationRewardsButton"
import { ClaimDelegationRewardsModal, type DelegationModalData } from "@/components/ClaimDelegationRewardsModal"
import { WalletDelegationItem } from "./WalletDelegationItem"
import { WalletDirectStakeItem } from "./WalletDirectStakeItem"
import type { Erc20DelegationBreakdown, Erc20DirectStakeBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { Address } from "viem"

interface WalletStakesDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  delegations: Erc20DelegationBreakdown[]
  directStakes: Erc20DirectStakeBreakdown[]
  onWithdrawSuccess?: () => void
}

/**
 * Modal for displaying wallet (ERC20) stakes and delegations
 * Shows all wallet-based staking positions with unstaking functionality
 */
export const WalletStakesDetailsModal = ({
  isOpen,
  onClose,
  delegations,
  directStakes,
  onWithdrawSuccess
}: WalletStakesDetailsModalProps) => {
  const { symbol, decimals } = useStakingAssetTokenDetails()
  const [isDelegationClaimModalOpen, setIsDelegationClaimModalOpen] = useState(false)
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationModalData | null>(null)

  if (!isOpen) return null

  // Filter out UNSTAKED positions
  const activeDelegations = delegations.filter(d => d.status !== 'UNSTAKED')
  const activeDirectStakes = directStakes.filter(s => s.status !== 'UNSTAKED')

  // Calculate totals
  const totalDelegated = activeDelegations.reduce((sum, d) => sum + (d.hasFailedDeposit ? 0n : d.stakedAmount), 0n)
  const totalDirectStaked = activeDirectStakes.reduce((sum, s) => sum + (s.hasFailedDeposit ? 0n : s.stakedAmount), 0n)
  const totalStaked = totalDelegated + totalDirectStaked
  const totalRewards = activeDelegations.reduce((sum, d) => sum + (d.hasFailedDeposit ? 0n : d.rewards), 0n)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDelegationClaimClick = (delegation: {
    splitContract: Address
    providerName: string | null
    providerTakeRate: number
    providerRewardsRecipient: Address
  }) => {
    setSelectedDelegation({
      splitContract: delegation.splitContract,
      providerName: delegation.providerName,
      providerTakeRate: delegation.providerTakeRate,
      providerRewardsRecipient: delegation.providerRewardsRecipient
    })
    setIsDelegationClaimModalOpen(true)
  }

  const handleCloseDelegationModal = () => {
    setIsDelegationClaimModalOpen(false)
    setSelectedDelegation(null)
  }

  return createPortal(
    <ClaimAllProvider>
      <div
        className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-16"
        onClick={handleBackdropClick}
      >
        <div className="bg-ink border border-parchment/20 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
          <div className="p-6 relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="wallet" size="lg" className="text-chartreuse" />
                  <h2 className="font-oracle-standard text-lg font-bold uppercase tracking-wider text-parchment">
                    Wallet Stakes
                  </h2>
                </div>
                <p className="text-xs text-parchment/60">
                  Your ERC20 token stakes directly from your wallet
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-parchment/10 transition-colors"
                aria-label="Close modal"
              >
                <Icon name="x" size="md" className="text-parchment/60" />
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-parchment/5 border border-parchment/10">
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Total Staked</div>
                <div className="font-mono text-lg font-bold text-parchment">
                  {formatTokenAmount(totalStaked, decimals, symbol)}
                </div>
              </div>
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Delegation Rewards</div>
                <div className="font-mono text-lg font-bold text-chartreuse">
                  {formatTokenAmount(totalRewards, decimals, symbol)}
                </div>
              </div>
              <div>
                <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Active Positions</div>
                <div className="font-mono text-lg font-bold text-parchment">
                  {activeDelegations.length + activeDirectStakes.length}
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-2 mb-6 p-4 bg-aqua/10 border border-aqua/30 text-aqua">
              <Icon name="info" size="md" className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                These are stakes made directly from your wallet using ERC20 tokens.
                When you unstake, funds will be returned directly to your wallet.
              </div>
            </div>

            {/* Direct Stakes Section */}
            {activeDirectStakes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
                    Self Stakes ({activeDirectStakes.length})
                  </h3>
                </div>
                <div className="space-y-4">
                  {activeDirectStakes.map((stake, index) => (
                    <WalletDirectStakeItem
                      key={`direct-${stake.attesterAddress}-${index}`}
                      stake={stake}
                      onWithdrawSuccess={onWithdrawSuccess}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Delegations Section */}
            {activeDelegations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
                      Delegations ({activeDelegations.length})
                    </h3>
                  </div>
                  <ClaimAllDelegationRewardsButton
                    delegations={activeDelegations
                      .filter(d => !d.hasFailedDeposit)
                      .map(d => ({
                        splitContract: d.splitContract,
                        providerTakeRate: d.providerTakeRate,
                        providerRewardsRecipient: d.providerRewardsRecipient,
                        rewards: d.rewards
                      }))}
                    onSuccess={onWithdrawSuccess}
                  />
                </div>
                <div className="space-y-2">
                  {activeDelegations.map((delegation, index) => (
                    <WalletDelegationItem
                      key={`delegation-${delegation.attesterAddress}-${index}`}
                      delegation={delegation}
                      onClaimClick={handleDelegationClaimClick}
                      onWithdrawSuccess={onWithdrawSuccess}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {activeDelegations.length === 0 && activeDirectStakes.length === 0 && (
              <div className="bg-parchment/5 border border-parchment/20 p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Icon name="wallet" className="w-8 h-8 text-parchment/40" />
                  <div>
                    <div className="font-oracle-standard text-sm font-medium text-parchment/80 mb-1">
                      No Wallet Stakes
                    </div>
                    <div className="text-xs text-parchment/60">
                      You haven't staked any ERC20 tokens from your wallet yet
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claim Delegation Rewards Modal */}
      {selectedDelegation && (
        <ClaimDelegationRewardsModal
          isOpen={isDelegationClaimModalOpen}
          onClose={handleCloseDelegationModal}
          delegation={selectedDelegation}
          onSuccess={() => {
            onWithdrawSuccess?.()
            handleCloseDelegationModal()
          }}
        />
      )}
    </ClaimAllProvider>,
    document.body
  )
}
