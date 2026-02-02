import { useEffect } from "react"
import { useAccount } from "wagmi"
import { useClaimSplitRewards } from "@/hooks/splits"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useAlert } from "@/contexts/AlertContext"
import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useWarehouseBalance } from "@/hooks/splits/useWarehouseBalance"
import { useSplitsWarehouse } from "@/hooks/splits/useSplitsWarehouse"
import type { Address } from "viem"

interface ClaimDelegationRewardsButtonProps {
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  onSuccess?: () => void
  variant?: 'default' | 'modal'
}

/**
 * Button component for claiming delegation rewards
 * Handles the complete claim flow (claim → distribute → withdraw)
 * Shows skip messages when steps have zero balance
 */
export const ClaimDelegationRewardsButton = ({
  splitContract,
  providerTakeRate,
  providerRewardsRecipient,
  onSuccess,
  variant = 'default'
}: ClaimDelegationRewardsButtonProps) => {
  const { address: beneficiary } = useAccount() // TODO : should get the address from atp.beneficiary to handle the condition where the connected address is operator
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()
  const { showAlert } = useAlert()

  // Fetch balances for skip logic
  const { warehouseAddress } = useSplitsWarehouse(splitContract)
  const { rewards: rollupBalance } = useSequencerRewards(splitContract)
  const { balance: splitContractBalance } = useERC20Balance(tokenAddress!, splitContract)
  const { balance: warehouseBalance } = useWarehouseBalance(warehouseAddress, beneficiary, tokenAddress)

  // Calculate split allocations based on provider take rate
  const totalAllocation = 10000n
  const providerAllocation = BigInt(providerTakeRate)
  const userAllocation = totalAllocation - providerAllocation

  // Recipients order: [provider, user] - matches contract
  const splitData = {
    recipients: [providerRewardsRecipient, beneficiary as Address],
    allocations: [providerAllocation, userAllocation],
    totalAllocation,
    distributionIncentive: 0
  }

  const {
    claim,
    claimStep,
    skipMessage,
    completedMessage,
    isClaiming,
    isSuccess,
    error
  } = useClaimSplitRewards(
    splitContract,
    splitData,
    tokenAddress!,
    beneficiary as Address,
    {
      rollupBalance,
      splitContractBalance,
      warehouseBalance
    }
  )

  // Call onSuccess callback when claim completes
  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess()
    }
  }, [isSuccess, onSuccess])

  // Handle errors
  useEffect(() => {
    if (error) {
      const errorMessage = error.message
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showAlert('warning', 'Transaction was cancelled')
      }
    }
  }, [error, showAlert])

  const handleClaim = () => {
    if (!tokenAddress || !beneficiary) return
    claim()
  }

  // Check if there are any rewards to claim
  const hasRewards = (rollupBalance || 0n) > 0n || (splitContractBalance || 0n) > 0n || (warehouseBalance || 0n) > 0n

  // Button state logic
  const isDisabled = isClaiming || !warehouseAddress || !hasRewards

  const getButtonText = () => {
    if (isClaiming) {
      // Show completed message if available
      if (completedMessage) return completedMessage
      // Show skip message if available
      if (skipMessage) return skipMessage

      if (claimStep === 'claiming') return 'Claiming'
      if (claimStep === 'distributing') return 'Distributing'
      return 'Withdrawing'
    }
    return 'Claim'
  }

  const getTitle = () => {
    if (!warehouseAddress) return 'Loading warehouse address...'
    if (!hasRewards) return 'No rewards available to claim'
    if (isClaiming) {
      // Show completed message in tooltip if available
      if (completedMessage) return completedMessage
      // Show skip message in tooltip if available
      if (skipMessage) return skipMessage

      if (claimStep === 'claiming') return 'Claiming rewards from rollup...'
      if (claimStep === 'distributing') return 'Distributing rewards...'
      return 'Withdrawing rewards...'
    }
    return 'Claim delegation rewards'
  }

  const buttonClass = variant === 'modal'
    ? `px-6 py-3 bg-chartreuse text-ink font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`
    : `px-3 py-1.5 border font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${isDisabled
      ? 'border-parchment/40 text-parchment/40 cursor-not-allowed'
      : 'border-chartreuse bg-chartreuse text-ink hover:bg-chartreuse/90'
    }`

  return (
    <button
      onClick={handleClaim}
      disabled={isDisabled}
      className={buttonClass}
      title={getTitle()}
    >
      {isClaiming ? (
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border rounded-full border-ink/30 border-t-ink animate-spin"></div>
          <span>{getButtonText()}</span>
        </div>
      ) : (
        variant === 'modal' ? 'Claim Rewards' : 'Claim'
      )}
    </button>
  )
}
