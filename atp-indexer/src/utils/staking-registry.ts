import { config } from "../config";

/**
 * Get provider configuration from StakingRegistry contract
 */
export async function getProviderConfiguration(
  providerIdentifier: bigint,
  client: any,
  blockNumber?: bigint
): Promise<{
  providerAdmin: string;
  providerTakeRate: number;
  providerRewardsRecipient: string;
}> {
  try {
    const result = await client.readContract({
      address: config.STAKING_REGISTRY_ADDRESS as `0x${string}`,
      abi: [
        {
          type: "function",
          name: "providerConfigurations",
          inputs: [{ name: "providerIdentifier", type: "uint256" }],
          outputs: [
            { name: "providerAdmin", type: "address" },
            { name: "providerTakeRate", type: "uint16" },
            { name: "providerRewardsRecipient", type: "address" },
          ],
          stateMutability: "view",
        },
      ],
      functionName: "providerConfigurations",
      args: [providerIdentifier],
      ...(blockNumber && { blockNumber }),
    });

    const [providerAdmin, providerTakeRate, providerRewardsRecipient] = result as [
      string,
      number,
      string
    ];

    return {
      providerAdmin,
      providerTakeRate,
      providerRewardsRecipient,
    };
  } catch (error) {
    console.error(
      `Failed to get provider configuration for ${providerIdentifier}:`,
      error
    );
    throw error;
  }
}
