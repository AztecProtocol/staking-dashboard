import { useReadContract } from "wagmi";
import { contracts } from "../../contracts";

export function useProviderQueueLength(providerIdentifier: number) {
  const { data: queueLength, refetch } = useReadContract({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "getProviderQueueLength",
    args: [BigInt(providerIdentifier)],
  });

  return {
    queueLength: queueLength ? Number(queueLength) : 0,
    refetchQueueLength: refetch,
  };
}
