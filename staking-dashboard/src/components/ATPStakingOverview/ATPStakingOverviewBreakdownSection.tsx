import { useState } from "react"
import { Icon } from "@/components/Icon"
import { ATPStakingOverviewDirectStakeItem } from "./ATPStakingOverviewDirectStakeItem"
import { ATPStakingOverviewDelegationItem } from "./ATPStakingOverviewDelegationItem"
import { ClaimAllDelegationRewardsButton } from "@/components/ClaimAllDelegationRewardsButton"
import { ClaimSelfStakeRewardsModal, type SelfStakeModalData } from "@/components/ClaimSelfStakeRewardsModal"
import { ClaimDelegationRewardsModal, type DelegationModalData } from "@/components/ClaimDelegationRewardsModal"
import { WalletStakesDetailsModal } from "@/components/WalletStakesDetailsModal"
import { useAggregatedStakingData } from "@/hooks/atp/useAggregatedStakingData"
import type { ATPData } from "@/hooks/atp"
import type { DirectStakeBreakdown, DelegationBreakdown, Erc20DelegationBreakdown, Erc20DirectStakeBreakdown } from "@/hooks/atp/useAggregatedStakingData"
import type { Address } from "viem"

interface ATPStakingOverviewBreakdownSectionProps {
  directStakeBreakdown: DirectStakeBreakdown[]
  delegationBreakdown: DelegationBreakdown[]
  erc20DelegationBreakdown: Erc20DelegationBreakdown[]
  erc20DirectStakeBreakdown: Erc20DirectStakeBreakdown[]
  atpData: ATPData[]
  decimals: number
  symbol: string
  onATPClick: (atp: ATPData) => void
}

/**
 * Displays detailed breakdown of all stakes (direct and delegations)
 */
export const ATPStakingOverviewBreakdownSection = ({
  directStakeBreakdown,
  delegationBreakdown,
  erc20DelegationBreakdown,
  erc20DirectStakeBreakdown,
  atpData,
  decimals,
  symbol,
  onATPClick
}: ATPStakingOverviewBreakdownSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showFailedSelfStakes, setShowFailedSelfStakes] = useState(false)
  const [showFailedDelegations, setShowFailedDelegations] = useState(false)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [selectedStake, setSelectedStake] = useState<{
    stake: SelfStakeModalData
    atp: ATPData | undefined
  } | null>(null)
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationModalData | null>(null)
  const [isDelegationClaimModalOpen, setIsDelegationClaimModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  const { refetch: refetchStakingOverview } = useAggregatedStakingData()

  const handleClaimClick = (stake: DirectStakeBreakdown, atp: ATPData | undefined) => {
    setSelectedStake({
      stake: {
        atpAddress: stake.atpAddress,
        attesterAddress: stake.attesterAddress,
        stakedAmount: stake.stakedAmount
      },
      atp
    })
    setIsClaimModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsClaimModalOpen(false)
    setSelectedStake(null)
  }

  const handleDelegationClaimClick = (delegation: DelegationBreakdown | Erc20DelegationBreakdown) => {
    setSelectedDelegation({
      splitContract: delegation.splitContract as Address,
      providerName: delegation.providerName!,
      providerTakeRate: delegation.providerTakeRate,
      providerRewardsRecipient: delegation.providerRewardsRecipient as Address
    })
    setIsDelegationClaimModalOpen(true)
  }

  const handleCloseDelegationModal = () => {
    setIsDelegationClaimModalOpen(false)
    setSelectedDelegation(null)
  }

  const handleRefetchAll = async () => {
    await refetchStakingOverview()
  }

  // Filter out UNSTAKED (withdrawn) stakes - they should never be shown
  const activeDirectStakes = directStakeBreakdown.filter(s => s.status !== 'UNSTAKED')
  const activeDelegations = delegationBreakdown.filter(d => d.status !== 'UNSTAKED')
  const activeErc20Delegations = erc20DelegationBreakdown.filter(d => d.status !== 'UNSTAKED')
  const activeErc20DirectStakes = erc20DirectStakeBreakdown.filter(s => s.status !== 'UNSTAKED')

  // Filter based on toggle state (only for failed deposits toggle)
  const filteredDirectStakes = showFailedSelfStakes
    ? activeDirectStakes
    : activeDirectStakes.filter(s => !s.hasFailedDeposit)

  const filteredDelegations = showFailedDelegations
    ? activeDelegations
    : activeDelegations.filter(d => !d.hasFailedDeposit)

  // ERC20 filtering (use same toggle as ATP for simplicity)
  const filteredErc20Delegations = showFailedDelegations
    ? activeErc20Delegations
    : activeErc20Delegations.filter(d => !d.hasFailedDeposit)

  const filteredErc20DirectStakes = showFailedSelfStakes
    ? activeErc20DirectStakes
    : activeErc20DirectStakes.filter(s => !s.hasFailedDeposit)

  // Count failed stakes (only from active stakes) - include both ATP and ERC20
  const failedSelfStakesCount = activeDirectStakes.filter(s => s.hasFailedDeposit).length +
    activeErc20DirectStakes.filter(s => s.hasFailedDeposit).length
  const failedDelegationsCount = activeDelegations.filter(d => d.hasFailedDeposit).length +
    activeErc20Delegations.filter(d => d.hasFailedDeposit).length

  return (
    <div className="mt-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-parchment/5 border border-parchment/20 hover:border-chartreuse/40 hover:bg-parchment/8 transition-all cursor-pointer group"
      >
        <div className="text-sm text-parchment font-oracle-standard font-bold uppercase tracking-wide group-hover:text-chartreuse transition-colors">
          Stake Breakdown
        </div>
        <Icon
          name="chevronDown"
          size="lg"
          className={`text-parchment/60 group-hover:text-chartreuse transition-all ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-8">
          {/* Self Stake Breakdown (ATP + ERC20 Direct Stakes) */}
          {(activeDirectStakes.length > 0 || activeErc20DirectStakes.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-parchment/10">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-parchment/80 uppercase tracking-wide font-oracle-standard font-bold">
                    Self Stake ({filteredDirectStakes.length + filteredErc20DirectStakes.length} Sequencer{(filteredDirectStakes.length + filteredErc20DirectStakes.length) !== 1 ? 's' : ''})
                  </div>
                  {failedSelfStakesCount > 0 && (
                    <button
                      onClick={() => setShowFailedSelfStakes(!showFailedSelfStakes)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-oracle-standard font-bold uppercase tracking-wide transition-all
                        ${!showFailedSelfStakes
                          ? 'bg-vermillion/10 border-vermillion/30 text-vermillion/60 hover:bg-vermillion/20 hover:border-vermillion/40'
                          : 'bg-parchment/10 border-parchment/30 text-parchment/60 hover:bg-parchment/20 hover:border-parchment/40'
                        }
                      `}
                      title={!showFailedSelfStakes ? 'Show failed deposits' : 'Hide failed deposits'}
                    >
                      <Icon name={!showFailedSelfStakes ? 'eye' : 'eyeOff'} size="sm" />
                      {!showFailedSelfStakes ? 'Show' : 'Hide'} Failed
                    </button>
                  )}
                </div>
              </div>
              {(filteredDirectStakes.length > 0 || filteredErc20DirectStakes.length > 0) ? (
                <div className="space-y-2">
                  {/* ATP Direct Stakes */}
                  {filteredDirectStakes.map((stake, index) => {
                    const atp = atpData.find(a => a.atpAddress.toLowerCase() === stake.atpAddress.toLowerCase())
                    return (
                      <ATPStakingOverviewDirectStakeItem
                        key={`atp-${stake.attesterAddress}-${index}`}
                        stake={stake}
                        atp={atp}
                        decimals={decimals}
                        symbol={symbol}
                        onATPClick={onATPClick}
                        onClaimClick={handleClaimClick}
                      />
                    )
                  })}
                  {/* ERC20 Direct Stakes */}
                  {filteredErc20DirectStakes.map((stake, index) => (
                    <ATPStakingOverviewDirectStakeItem
                      key={`erc20-direct-${stake.attesterAddress}-${index}`}
                      stake={stake}
                      decimals={decimals}
                      symbol={symbol}
                      variant="wallet"
                      onWalletClick={() => setIsWalletModalOpen(true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="text-sm text-parchment/50 italic">
                    No self stakes
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delegation Breakdown (ATP + ERC20 Delegations) */}
          {(activeDelegations.length > 0 || activeErc20Delegations.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-parchment/10">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-parchment/80 uppercase tracking-wide font-oracle-standard font-bold">
                    Delegations ({filteredDelegations.length + filteredErc20Delegations.length} Provider{(filteredDelegations.length + filteredErc20Delegations.length) !== 1 ? 's' : ''})
                  </div>
                  {failedDelegationsCount > 0 && (
                    <button
                      onClick={() => setShowFailedDelegations(!showFailedDelegations)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-oracle-standard font-bold uppercase tracking-wide transition-all
                        ${!showFailedDelegations
                          ? 'bg-vermillion/10 border-vermillion/30 text-vermillion/60 hover:bg-vermillion/20 hover:border-vermillion/40'
                          : 'bg-parchment/10 border-parchment/30 text-parchment/60 hover:bg-parchment/20 hover:border-parchment/40'
                        }
                      `}
                      title={!showFailedDelegations ? 'Show failed deposits' : 'Hide failed deposits'}
                    >
                      <Icon name={!showFailedDelegations ? 'eye' : 'eyeOff'} size="sm" />
                      {!showFailedDelegations ? 'Show' : 'Hide'} Failed
                    </button>
                  )}
                </div>
                {/* Claim All Button - shows when there are delegations with rewards (ATP + ERC20) */}
                <ClaimAllDelegationRewardsButton
                  delegations={[
                    ...filteredDelegations.map(d => ({
                      splitContract: d.splitContract as `0x${string}`,
                      providerTakeRate: d.providerTakeRate,
                      providerRewardsRecipient: d.providerRewardsRecipient as `0x${string}`,
                      rewards: d.rewards,
                    })),
                    ...filteredErc20Delegations.map(d => ({
                      splitContract: d.splitContract as `0x${string}`,
                      providerTakeRate: d.providerTakeRate,
                      providerRewardsRecipient: d.providerRewardsRecipient as `0x${string}`,
                      rewards: d.rewards,
                    }))
                  ]}
                  onSuccess={handleRefetchAll}
                />
              </div>
              {(filteredDelegations.length > 0 || filteredErc20Delegations.length > 0) ? (
                <div className="space-y-2">
                  {/* ATP Delegations */}
                  {filteredDelegations.map((delegation, index) => {
                    const atp = atpData.find(a => a.atpAddress.toLowerCase() === delegation.atpAddress.toLowerCase())
                    return (
                      <ATPStakingOverviewDelegationItem
                        key={`atp-delegation-${delegation.attesterAddress}-${index}`}
                        delegation={delegation}
                        atp={atp}
                        decimals={decimals}
                        symbol={symbol}
                        onATPClick={onATPClick}
                        onClaimClick={handleDelegationClaimClick}
                      />
                    )
                  })}
                  {/* ERC20 Delegations */}
                  {filteredErc20Delegations.map((delegation, index) => (
                    <ATPStakingOverviewDelegationItem
                      key={`erc20-delegation-${delegation.attesterAddress}-${index}`}
                      delegation={delegation}
                      decimals={decimals}
                      symbol={symbol}
                      variant="wallet"
                      onWalletClick={() => setIsWalletModalOpen(true)}
                      onClaimClick={handleDelegationClaimClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="text-sm text-parchment/50 italic">
                    No delegations
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Claim Self Stake Rewards Modal */}
      {selectedStake && (
        <ClaimSelfStakeRewardsModal
          isOpen={isClaimModalOpen}
          onClose={handleCloseModal}
          stake={selectedStake.stake}
          atp={selectedStake.atp}
          onSuccess={handleRefetchAll}
        />
      )}

      {/* Claim Delegation Rewards Modal */}
      {selectedDelegation && (
        <ClaimDelegationRewardsModal
          isOpen={isDelegationClaimModalOpen}
          onClose={handleCloseDelegationModal}
          delegation={selectedDelegation}
          onSuccess={handleRefetchAll}
        />
      )}

      {/* Wallet Stakes Details Modal */}
      <WalletStakesDetailsModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        delegations={activeErc20Delegations}
        directStakes={activeErc20DirectStakes}
        onWithdrawSuccess={handleRefetchAll}
      />
    </div>
  )
}
