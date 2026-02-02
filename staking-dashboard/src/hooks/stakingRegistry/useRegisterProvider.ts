import { contracts } from "../../contracts";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { useState, useEffect } from "react";
import type { Address } from "viem";

export function useRegisterProvider() {
  const write = useWriteContract();
  const [assignedProviderId, setAssignedProviderId] = useState<bigint | null>(
    null,
  );

  // Read the current nextProviderIdentifier to predict the return value
  const nextProviderIdQuery = useReadContract({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "nextProviderIdentifier",
  });

  // Wait for the transaction receipt after sending
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  // Extract provider ID from transaction logs when receipt is successful
  useEffect(() => {
    if (receipt.isSuccess && receipt.data?.logs) {
      // Look for ProviderRegistered event in the logs
      for (const log of receipt.data.logs) {
        if (log.topics.length > 0 && log.topics[0]) {
          // ProviderRegistered event signature
          const providerRegisteredEventHash =
            "0x6ce25a8d8415b24e41a9c4b30e5dfcb3b4e49b2dc84eca7b47e9b17c1ecf4bc7";
          if (log.topics[0] === providerRegisteredEventHash && log.topics[1]) {
            // First indexed parameter is the provider identifier
            const providerIdHex = log.topics[1];
            const providerId = BigInt(providerIdHex);
            setAssignedProviderId(providerId);
            break;
          }
        }
      }
    }
  }, [receipt.isSuccess, receipt.data]);

  return {
    registerProvider: (providerAdmin: Address) =>
      write.writeContract({
        abi: contracts.stakingRegistry.abi,
        address: contracts.stakingRegistry.address,
        functionName: "registerProvider",
        args: [providerAdmin, 10, providerAdmin],
      }),

    // State
    txHash: write.data,
    assignedProviderId, // The actual provider ID returned by the function
    expectedProviderId: nextProviderIdQuery.data as bigint | undefined, // What the function will return
    error: write.error || receipt.error, // Include both wallet errors and transaction errors
    isPending: write.isPending, // Wallet confirmation
    isConfirming: receipt.isLoading, // Waiting to be mined
    isSuccess: receipt.isSuccess, // Successfully mined
    isError: receipt.isError, // Failed/reverted
  };
}
