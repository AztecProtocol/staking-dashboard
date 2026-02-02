import { SourceSelectionModal } from "@/components/SourceSelectionModal"
import { useProviderQueueLength } from "@/hooks/stakingRegistry/useProviderQueueLength"
import type { StakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"
import type { ProviderDetail } from "@/hooks/providers/useProviderDetail"

interface StakingFlowModalProps {
  isOpen: boolean
  provider: ProviderDetail
  onClose: () => void
  onSelectWallet: (stakeCount: number) => void
  onSelectVault: (atp: StakeableATPData, stakeCount: number) => void
}

/**
 * Modal for selecting staking source and stake count when delegating to a provider.
 * Wraps SourceSelectionModal with provider-specific queue length constraint.
 */
export const StakingFlowModal = ({
  isOpen,
  provider,
  onClose,
  onSelectWallet,
  onSelectVault,
}: StakingFlowModalProps) => {
  const { queueLength } = useProviderQueueLength(Number(provider.id))

  return (
    <SourceSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onSelectWallet={onSelectWallet}
      onSelectVault={onSelectVault}
      headerTitle={`Delegate to ${provider.name}`}
      headerSubtitle="Select your staking source and amount to be staked"
      stakeCountLabel="Stake Count"
      maxStakesOverride={queueLength}
    />
  )
}
