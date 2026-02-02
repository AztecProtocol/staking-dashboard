/**
 * Calculates user's share of rewards from a split contract
 * @param totalRewards - Total rewards in the split contract
 * @param takeRate - Provider's take rate in basis points (0-10000)
 * @returns User's share of rewards after provider's cut
 */
export const calculateUserShareFromTakeRate = (
  totalRewards: bigint,
  takeRate: number
): bigint => {
  const userShare = 10000 - takeRate
  return totalRewards * BigInt(userShare) / 10000n
}

/**
 * Calculate total user share from all three reward sources
 * @param rollupBalance - Rewards on rollup (needs to be split according to take rate)
 * @param splitContractBalance - Rewards on split contract (needs to be split according to take rate)
 * @param warehouseBalance - Rewards in warehouse (already user's share, already distributed)
 * @param providerTakeRate - Provider's take rate in basis points (0-10000)
 * @returns Total user's share across all sources
 */
export const calculateTotalUserShareFromSplitRewards = (
  rollupBalance: bigint,
  splitContractBalance: bigint,
  warehouseBalance: bigint,
  providerTakeRate: number
): bigint => {
  // Calculate user's share from rollup and split contract balances
  const userShareFromRollup = calculateUserShareFromTakeRate(rollupBalance, providerTakeRate)
  const userShareFromSplitContract = calculateUserShareFromTakeRate(splitContractBalance, providerTakeRate)

  // Warehouse balance is already the user's share (already distributed)
  return userShareFromRollup + userShareFromSplitContract + warehouseBalance
}
