import { isAddress, type Address } from "viem";
import { useReadContract } from "wagmi";
import { ERC20Abi } from "../../contracts/abis/ERC20";

/**
 * Hook to get the allowance for a spender on an ERC20 token
 * @param tokenAddress - Token contract address (can be undefined, query won't run if falsy)
 * @param owner - Owner address (can be undefined, query won't run if falsy)
 * @param spender - Spender address (can be undefined, query won't run if falsy)
 */
export function useAllowance({
  tokenAddress,
  owner,
  spender,
}: {
  tokenAddress?: Address;
  owner?: Address;
  spender?: Address;
}) {
  const allowanceQuery = useReadContract({
    abi: ERC20Abi,
    // Safe to assert: enabled guard prevents query execution when addresses are invalid
    address: tokenAddress as Address,
    functionName: "allowance",
    args: [owner as Address, spender as Address],
    query: {
      enabled:
        isAddress(tokenAddress ?? "") &&
        isAddress(spender ?? "") &&
        isAddress(owner ?? ""),
    },
  });

  return {
    allowance: allowanceQuery.data as bigint | undefined,
    isLoading: allowanceQuery.isLoading,
    error: allowanceQuery.error,
    refetch: allowanceQuery.refetch,
  };
}
