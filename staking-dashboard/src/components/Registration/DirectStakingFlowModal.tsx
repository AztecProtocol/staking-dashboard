import { SourceSelectionModal } from "@/components/SourceSelectionModal"
import type { StakeableATPData } from "@/hooks/atp/useMultipleStakeableAmounts"

interface DirectStakingFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWallet: (stakeCount: number) => void
  onSelectVault: (atp: StakeableATPData, stakeCount: number) => void
}

/**
 * Modal for selecting staking source and stake count for direct staking (own validator registration).
 * Wraps SourceSelectionModal with direct staking specific text.
 */
export const DirectStakingFlowModal = ({
  isOpen,
  onClose,
  onSelectWallet,
  onSelectVault,
}: DirectStakingFlowModalProps) => {
  return (
    <SourceSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onSelectWallet={onSelectWallet}
      onSelectVault={onSelectVault}
      headerTitle="Register Your Sequencer"
      headerSubtitle="Select your staking source and number of sequencers to register"
      stakeCountLabel="Number of Sequencers"
    />
  )
}
