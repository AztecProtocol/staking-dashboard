import { useReadContracts } from "wagmi"
import { contracts } from "../../contracts"

/**
 * Fetches queue lengths for multiple providers in parallel
 */
export function useMultipleProviderQueueLengths(providerIds: number[]) {
  const contractCalls = providerIds.map(id => ({
    abi: contracts.stakingRegistry.abi,
    address: contracts.stakingRegistry.address,
    functionName: "getProviderQueueLength" as const,
    args: [BigInt(id)]
  }))

  const { data, isLoading, refetch } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: providerIds.length > 0
    }
  })

  // Convert results to a Map for easy lookup
  const queueLengths = new Map<number, number>()

  if (data) {
    providerIds.forEach((id, index) => {
      const result = data[index]
      if (result.status === 'success' && result.result !== undefined) {
        queueLengths.set(id, Number(result.result))
      } else {
        queueLengths.set(id, 0)
      }
    })
  }

  return {
    queueLengths,
    isLoading,
    refetch
  }
}
