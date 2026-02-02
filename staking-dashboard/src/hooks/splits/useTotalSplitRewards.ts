import { useSequencerRewards } from "@/hooks/rollup/useSequencerRewards"
import { useERC20Balance } from "@/hooks/erc20/useERC20Balance"
import { useWarehouseBalance } from "./useWarehouseBalance"
import { useSplitsWarehouse } from "./useSplitsWarehouse"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry"
import { calculateTotalUserShareFromSplitRewards, calculateUserShareFromTakeRate } from "@/utils/rewardCalculations"
import type { Address } from "viem"

/**
 * Hook to calculate total accumulated split rewards for a user
 * Combines rewards from rollup, split contract, and warehouse balances
 * Accounts for provider take rate when calculating user's share
 */
export const useTotalSplitRewards = (
  splitContractAddress: Address,
  beneficiary: Address | undefined,
  providerTakeRate: number
) => {
  const { stakingAssetAddress: tokenAddress } = useStakingAssetTokenDetails()

  // Get warehouse address from split contract
  const { warehouseAddress } = useSplitsWarehouse(splitContractAddress)

  // Get rewards balance on rollup (step 1 - needs to be claimed to split contract)
  const {
    rewards: rollupBalance,
    isLoading: isLoadingRollup
  } = useSequencerRewards(splitContractAddress)

  // Get rewards balance on split contract (step 2 - needs to be distributed)
  const {
    balance: splitContractBalance,
    isLoading: isLoadingSplitContract
  } = useERC20Balance(tokenAddress!, splitContractAddress)

  // Get rewards balance in warehouse (step 3 - ready to withdraw)
  const {
    balance: warehouseBalance,
    isLoading: isLoadingWarehouse
  } = useWarehouseBalance(warehouseAddress, beneficiary, tokenAddress)

  const isLoading = isLoadingRollup || isLoadingSplitContract || isLoadingWarehouse

  // Calculate user's share from each balance source
  const userShareFromRollup = calculateUserShareFromTakeRate(rollupBalance || 0n, providerTakeRate)
  const userShareFromSplitContract = calculateUserShareFromTakeRate(splitContractBalance || 0n, providerTakeRate)

  // Calculate total user's share using shared calculation
  const totalUserShare = calculateTotalUserShareFromSplitRewards(
    rollupBalance || 0n,
    splitContractBalance || 0n,
    warehouseBalance || 0n,
    providerTakeRate
  )

  return {
    totalUserShare,
    rollupBalance,
    splitContractBalance,
    warehouseBalance,
    userShareFromRollup,
    userShareFromSplitContract,
    isLoading
  }
}
