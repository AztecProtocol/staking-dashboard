/**
 * Staking API Response Types
 */

import type { StakeStatus } from './atp.types';

export interface StakingStats {
  totalStakes: number;
  delegatedStakes: number;
  atpDelegatedStakes: number;
  erc20DelegatedStakes: number;
  directStakes: number;              // ATP direct stakes (via Staker contract)
  erc20DirectStakes: number;         // ERC20 direct stakes (own validator registrations via Rollup.deposit)
  failedDeposits: number;
  activeProviders: number;
  totalATPs: number;
  activationThreshold: string;
}

export interface StakingSummaryResponse {
  totalValueLocked: string;
  totalStakers: number;
  currentAPR: number;
  stats: StakingStats;
}

export interface DirectStakeBreakdown {
  atpAddress: string;
  attesterAddress: string;
  stakedAmount: string;
  hasFailedDeposit: boolean;
  failedDepositTxHash: string | null;
  failureReason: string | null;
  status: StakeStatus;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  providerId?: number;
  providerName?: string;
  providerLogo?: string;
}

export interface DelegationBreakdown {
  atpAddress: string;
  providerId: number;
  providerName: string;
  providerLogo: string;
  attesterAddress: string;
  stakedAmount: string;
  splitContract: string;
  providerTakeRate: number;
  providerRewardsRecipient: string;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  hasFailedDeposit: boolean;
  failedDepositTxHash: string | null;
  failureReason: string | null;
  status: StakeStatus;
}

export interface Erc20DelegationBreakdown {
  providerId: number;
  providerName: string;
  providerLogo: string;
  attesterAddress: string;
  stakedAmount: string;
  splitContract: string;
  providerTakeRate: number;
  providerRewardsRecipient: string;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  hasFailedDeposit: boolean;
  failedDepositTxHash: string | null;
  failureReason: string | null;
  status: StakeStatus;
}

export interface Erc20DirectStakeBreakdown {
  attesterAddress: string;
  withdrawerAddress: string;
  stakedAmount: string;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  hasFailedDeposit: boolean;
  failedDepositTxHash: string | null;
  failureReason: string | null;
  status: StakeStatus;
}

export interface BeneficiaryStakingOverviewResponse {
  totalStaked: string;
  totalDirectStaked: string;
  totalDelegated: string;
  totalErc20Delegated: string;
  totalErc20DirectStaked: string;
  directStakeBreakdown: DirectStakeBreakdown[];
  delegationBreakdown: DelegationBreakdown[];
  erc20DelegationBreakdown: Erc20DelegationBreakdown[];
  erc20DirectStakeBreakdown: Erc20DirectStakeBreakdown[];
}
