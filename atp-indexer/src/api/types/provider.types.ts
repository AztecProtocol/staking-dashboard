/**
 * Provider API Response Types
 */

export interface ProviderSummary {
  id: string;
  name: string;
  commission: number;
  delegators: number;
  totalStaked: string;
  address: string;
  description: string;
  website: string;
  logo_url: string;
  providerSelfStake?: string[];
}

export interface NotAssociatedStake {
  delegators: number;
  totalStaked: string;
}

export interface ProviderListResponse {
  providers: ProviderSummary[];
  totalStaked: string;
  notAssociatedStake?: NotAssociatedStake;
}

export interface ProviderStake {
  atpAddress?: string;  // Only present for ATP-based delegations
  stakerAddress: string;
  splitContractAddress: string;
  rollupAddress: string;
  attesterAddress: string;
  stakedAmount: string;
  blockNumber: string;
  txHash: string;
  timestamp: number;
  source?: 'atp' | 'erc20';  // Indicates the delegation source
}

export interface ProviderTakeRateUpdate {
  newTakeRate: number;
  previousTakeRate: number;
  updatedAtBlock: string;
  updatedAtTx: string;
  updatedAtTime: number;
}

export interface ProviderDetailsResponse {
  id: string;
  name: string;
  description: string;
  email: string;
  website: string;
  logoUrl: string;
  discord: string;
  commission: number;
  address: string;
  totalStaked: string;
  networkTotalStaked: string;
  delegators: number;
  createdAtBlock: string;
  createdAtTx: string;
  createdAtTime: number;
  stakes: ProviderStake[];
  takeRateHistory: ProviderTakeRateUpdate[];
  providerSelfStake?: string[];
}
