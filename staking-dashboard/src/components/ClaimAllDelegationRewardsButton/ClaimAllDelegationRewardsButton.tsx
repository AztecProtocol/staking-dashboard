import { useEffect, useMemo } from "react"
import { useAccount } from "wagmi"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { useIsRewardsClaimable } from "@/hooks/rollup/useIsRewardsClaimable"
import { useClaimAllContext } from "@/contexts/ClaimAllContext"
import { useAlert } from "@/contexts/AlertContext"
import type { Address } from "viem"

interface DelegationClaim {
  splitContract: Address
  providerTakeRate: number
  providerRewardsRecipient: Address
  rewards: bigint
}

interface ClaimAllDelegationRewardsButtonProps {
  delegations: DelegationClaim[]
  onSuccess?: () => void
}

/**
 * Button component for claiming all delegation rewards at once
 * Processes claims sequentially to avoid race conditions
 */
export const ClaimAllDelegationRewardsButton = ({
  delegations,
  onSuccess
}: ClaimAllDelegationRewardsButtonProps) => {
  const { address: beneficiary } = useAccount() // TODO : should get the address from atp.beneficiary to handle the condition where the connected address is operator
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()
  const { isRewardsClaimable } = useIsRewardsClaimable()
  const { claimAllHook } = useClaimAllContext()
  const { showAlert } = useAlert()

  // Get delegations with rewards
  const delegationsWithRewards = useMemo(
    () => delegations.filter(d => d.rewards > 0n),
    [delegations]
  )

  // Call onSuccess when all claims complete
  useEffect(() => {
    if (!claimAllHook.isProcessing && claimAllHook.completedCount > 0) {
      onSuccess?.()
    }
  }, [claimAllHook.isProcessing, claimAllHook.completedCount, onSuccess])

  // Handle errors
  useEffect(() => {
    if (claimAllHook.error) {
      const errorMessage = claimAllHook.error.message
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        showAlert('warning', 'Transaction was cancelled')
      }
    }
  }, [claimAllHook.error, showAlert])

  const handleClaimAll = () => {
    if (!tokenAddress || !beneficiary || delegationsWithRewards.length === 0) return

    // Build claim tasks
    const tasks = delegationsWithRewards.map(delegation => {
      const totalAllocation = 10000n
      const providerAllocation = BigInt(delegation.providerTakeRate)
      const userAllocation = totalAllocation - providerAllocation

      return {
        splitContract: delegation.splitContract as Address,
        splitData: {
          recipients: [delegation.providerRewardsRecipient as Address, beneficiary],
          allocations: [providerAllocation, userAllocation],
          totalAllocation,
          distributionIncentive: 0
        },
        tokenAddress,
        userAddress: beneficiary,
        onSuccess
      }
    })

    claimAllHook.claimAll(tasks)
  }

  if (delegationsWithRewards.length === 0 || isRewardsClaimable === false) {
    return null
  }

  return (
    <>
      {claimAllHook.error && !(claimAllHook.error.message.includes('User rejected') || claimAllHook.error.message.includes('rejected')) && (
        <div className="mb-3 p-3 bg-vermillion/10 border border-vermillion/20 rounded">
          <div className="text-xs font-oracle-standard font-bold text-vermillion mb-1 uppercase tracking-wide">Transaction Error</div>
          <div className="text-xs text-parchment/80">
            {claimAllHook.error.message || 'An error occurred during batch claim'}
          </div>
        </div>
      )}
      <button
      onClick={handleClaimAll}
      disabled={claimAllHook.isProcessing}
      className={`px-4 py-1.5 border font-oracle-standard text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
        claimAllHook.isProcessing
          ? 'border-parchment/40 text-parchment/40 cursor-not-allowed'
          : 'border-chartreuse bg-chartreuse text-ink hover:bg-chartreuse/90'
      }`}
      title={
        claimAllHook.isProcessing
          ? `Claiming ${claimAllHook.progress}...`
          : 'Claim all delegation rewards'
      }
    >
      {claimAllHook.isProcessing ? (
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin"></div>
          <span>Claiming {claimAllHook.progress}</span>
        </div>
      ) : (
        `Claim All (${delegationsWithRewards.length})`
      )}
    </button>
    </>
  )
}
