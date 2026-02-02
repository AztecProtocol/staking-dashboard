import { useReadContract } from "wagmi";
import { contracts } from "../../contracts";

/**
 * Hook to get genesis sequencer sale data
 */
export function useGenesisSequencerData() {
  const purchasesPerAddressQuery = useReadContract({
    abi: contracts.genesisSequencerSale.abi,
    address: contracts.genesisSequencerSale.address,
    functionName: "PURCHASES_PER_ADDRESS",
  });

  return {
    purchasesPerAddress: purchasesPerAddressQuery.data as bigint | undefined,
    isLoading: purchasesPerAddressQuery.isLoading,
    error: purchasesPerAddressQuery.error,
  };
}
