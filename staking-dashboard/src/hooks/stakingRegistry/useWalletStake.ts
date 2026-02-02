import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { encodeFunctionData, type Address } from "viem"
import { contracts } from "@/contracts"
import type { RawTransaction } from "@/contexts/TransactionCartContext"

/**
 * Hook for staking ERC20 tokens directly with a provider via StakingRegistry
 * This is for wallet-based staking (not ATP staking)
 */
export function useWalletStake() {
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  return {
    /**
     * Stake ERC20 tokens with a provider
     * @param providerIdentifier - Provider ID to stake with
     * @param rollupVersion - Version of rollup (usually 0)
     * @param withdrawalAddress - Address that can withdraw the stake
     * @param expectedProviderTakeRate - Must match provider's current take rate
     * @param userRewardsRecipient - Address to receive user's share of rewards
     * @param moveWithLatestRollup - Auto-migrate if rollup upgrades
     */
    stake: (
      providerIdentifier: bigint | number,
      rollupVersion: bigint | number,
      withdrawalAddress: Address,
      expectedProviderTakeRate: number,
      userRewardsRecipient: Address,
      moveWithLatestRollup: boolean,
    ) =>
      write.writeContract({
        abi: contracts.stakingRegistry.abi,
        address: contracts.stakingRegistry.address,
        functionName: "stake",
        args: [
          BigInt(providerIdentifier),
          BigInt(rollupVersion),
          withdrawalAddress,
          expectedProviderTakeRate,
          userRewardsRecipient,
          moveWithLatestRollup,
        ],
      }),

    /**
     * Build raw transaction for queue/batching
     */
    buildRawTx: (
      providerIdentifier: bigint | number,
      rollupVersion: bigint | number,
      withdrawalAddress: Address,
      expectedProviderTakeRate: number,
      userRewardsRecipient: Address,
      moveWithLatestRollup: boolean,
    ): RawTransaction => ({
      to: contracts.stakingRegistry.address,
      data: encodeFunctionData({
        abi: contracts.stakingRegistry.abi,
        functionName: "stake",
        args: [
          BigInt(providerIdentifier),
          BigInt(rollupVersion),
          withdrawalAddress,
          expectedProviderTakeRate,
          userRewardsRecipient,
          moveWithLatestRollup,
        ],
      }),
      value: 0n,
    }),

    reset: write.reset,
    txHash: write.data,
    error: write.error || receipt.error,
    isPending: write.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
  }
}
