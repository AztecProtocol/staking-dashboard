import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { encodeFunctionData, type Address } from "viem"
import { contracts } from "@/contracts"
import type { RawTransaction } from "@/contexts/TransactionCartContext"
import type { G1Point, G2Point } from "@/hooks/staker/types"

/**
 * Hook for direct ERC20 staking via Rollup.deposit()
 * This is for wallet-based direct staking (own validator registration)
 * User calls Rollup.deposit() directly with their BLS keys
 */
export function useWalletDirectStake() {
  const write = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  })

  return {
    /**
     * Deposit ERC20 tokens directly to rollup with validator keys
     * @param attester - The validator/attester address
     * @param withdrawer - Address that can withdraw the stake (usually the user)
     * @param publicKeyG1 - BLS public key G1
     * @param publicKeyG2 - BLS public key G2
     * @param signature - BLS signature (proof of possession)
     * @param moveWithRollup - Auto-migrate if rollup upgrades
     */
    deposit: (
      attester: Address,
      withdrawer: Address,
      publicKeyG1: G1Point,
      publicKeyG2: G2Point,
      signature: G1Point,
      moveWithRollup: boolean,
    ) =>
      write.writeContract({
        abi: contracts.rollup.abi,
        address: contracts.rollup.address,
        functionName: "deposit",
        args: [
          attester,
          withdrawer,
          {
            x: BigInt(publicKeyG1.x),
            y: BigInt(publicKeyG1.y),
          },
          {
            x0: BigInt(publicKeyG2.x[0]),
            x1: BigInt(publicKeyG2.x[1]),
            y0: BigInt(publicKeyG2.y[0]),
            y1: BigInt(publicKeyG2.y[1]),
          },
          {
            x: BigInt(signature.x),
            y: BigInt(signature.y),
          },
          moveWithRollup,
        ],
      }),

    /**
     * Build raw transaction for queue/batching
     */
    buildRawTx: (
      attester: Address,
      withdrawer: Address,
      publicKeyG1: G1Point,
      publicKeyG2: G2Point,
      signature: G1Point,
      moveWithRollup: boolean,
    ): RawTransaction => ({
      to: contracts.rollup.address,
      data: encodeFunctionData({
        abi: contracts.rollup.abi,
        functionName: "deposit",
        args: [
          attester,
          withdrawer,
          {
            x: BigInt(publicKeyG1.x),
            y: BigInt(publicKeyG1.y),
          },
          {
            x0: BigInt(publicKeyG2.x[0]),
            x1: BigInt(publicKeyG2.x[1]),
            y0: BigInt(publicKeyG2.y[0]),
            y1: BigInt(publicKeyG2.y[1]),
          },
          {
            x: BigInt(signature.x),
            y: BigInt(signature.y),
          },
          moveWithRollup,
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
