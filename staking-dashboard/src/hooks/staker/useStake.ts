import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { encodeFunctionData, type Address } from "viem";
import { ATPNonWithdrawableStakerAbi } from "../../contracts/abis/ATPNonWithdrawableStaker";
import type { G1Point, G2Point } from "./types";
import type { RawTransaction } from "@/contexts/TransactionCartContext";

/**
 * Hook for staking with own validator
 * @param address Staker contract address that supports staking functionality
 */
export function useStake(address: Address) {
  const write = useWriteContract();

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    stake: (
      version: bigint,
      attester: Address,
      publicKeyG1: G1Point,
      publicKeyG2: G2Point,
      signature: G1Point,
      moveWithLatestRollup: boolean,
    ) =>
      write.writeContract({
        abi: ATPNonWithdrawableStakerAbi,
        address,
        functionName: "stake",
        args: [
          version,
          attester,
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
          moveWithLatestRollup,
        ],
      }),

    // Build raw transaction for queue/batching
    buildRawTx: (
      version: bigint,
      attester: Address,
      publicKeyG1: G1Point,
      publicKeyG2: G2Point,
      signature: G1Point,
      moveWithLatestRollup: boolean,
    ): RawTransaction => ({
      to: address,
      data: encodeFunctionData({
        abi: ATPNonWithdrawableStakerAbi,
        functionName: "stake",
        args: [
          version,
          attester,
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
  };
}
