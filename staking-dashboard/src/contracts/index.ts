import { z } from "zod";
import { isAddress, type Address } from "viem";

import { ATPFactoryAbi } from "./abis/ATPFactory";
import { StakingRegistryAbi } from "./abis/StakingRegistry";
import { AtpRegistryAbi } from "./abis/ATPRegistry";
import { RollupAbi } from "./abis/Rollup";
import { GenesisSequencerSale } from "./abis/GenesisSequencerSale";
import { ATPWithdrawableAndClaimableStakerAbi } from "./abis/ATPWithdrawableAndClaimableStaker";
import { GovernanceAbi } from "./abis/Governance";
import { GSEAbi } from "./abis/GSE";

// Define a reusable schema for Ethereum addresses
const addressSchema = z
  .string()
  .refine((val) => isAddress(val), {
    message: "Invalid Ethereum address",
  })
  .transform((val) => val as Address);

const contractEnvSchema = z.object({
  VITE_ATP_FACTORY_ADDRESS: addressSchema,
  VITE_ATP_FACTORY_AUCTION_ADDRESS: addressSchema,
  VITE_ATP_REGISTRY_ADDRESS: addressSchema,
  VITE_ATP_REGISTRY_AUCTION_ADDRESS: addressSchema,
  VITE_STAKING_REGISTRY_ADDRESS: addressSchema,
  VITE_ROLLUP_ADDRESS: addressSchema,
  VITE_GENESIS_SEQUENCER_SALE_ADDRESS: addressSchema.optional(),
  VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS: addressSchema,
  VITE_GOVERNANCE_ADDRESS: addressSchema,
  VITE_GSE_ADDRESS: addressSchema,
});

// Validate eagerly at startup
const env = contractEnvSchema.parse(import.meta.env);

const contracts = {
  atpFactory: {
    address: env.VITE_ATP_FACTORY_ADDRESS,
    abi: ATPFactoryAbi,
  },
  atpFactoryAuction: {
    address: env.VITE_ATP_FACTORY_AUCTION_ADDRESS,
    abi: ATPFactoryAbi,
  },
  atpRegistry: {
    address: env.VITE_ATP_REGISTRY_ADDRESS,
    abi: AtpRegistryAbi,
  },
  atpRegistryAuction: {
    address: env.VITE_ATP_REGISTRY_AUCTION_ADDRESS,
    abi: AtpRegistryAbi,
  },
  stakingRegistry: {
    address: env.VITE_STAKING_REGISTRY_ADDRESS,
    abi: StakingRegistryAbi,
  },
  rollup: {
    address: env.VITE_ROLLUP_ADDRESS,
    abi: RollupAbi,
  },
  genesisSequencerSale: {
    address: env.VITE_GENESIS_SEQUENCER_SALE_ADDRESS,
    abi: GenesisSequencerSale,
  },
  atpWithdrawableAndClaimableStaker: {
    address: env.VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS,
    abi: ATPWithdrawableAndClaimableStakerAbi,
  },
  governance: {
    address: env.VITE_GOVERNANCE_ADDRESS,
    abi: GovernanceAbi,
  },
  gse: {
    address: env.VITE_GSE_ADDRESS,
    abi: GSEAbi,
  },
} as const;

export { contracts };
