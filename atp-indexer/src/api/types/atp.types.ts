/**
 * ATP API Response Types
 */

export type StakeStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNSTAKED';

export interface ATPDirectStake {
  attesterAddress: string;
  operatorAddress: string;
  stakedAmount: string;
  totalSlashed: string;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  hasFailedDeposit: boolean;
  failedDepositTxHash: string | null;
  failureReason: string | null;
  status: StakeStatus;
}

export interface ATPDelegation {
  providerId: number;
  providerName: string;
  providerLogo: string;
  operatorAddress: string;
  stakedAmount: string;
  totalSlashed: string;
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

export interface ATPDetailsResponse {
  atp: {
    atpAddress: string;
    allocation: string;
  };
  summary: {
    totalStaked: string;
    totalSlashed: string;
  };
  directStakes: ATPDirectStake[];
  delegations: ATPDelegation[];
}

export interface ATPPosition {
  address: string;
  beneficiary: string;
  allocation: string;
  type: string;
  stakerAddress: string;
  sequentialNumber: number;
  timestamp: number;
  totalWithdrawn?: string;
  totalSlashed?: string;
  // NCATP-specific: withdrawal timestamp from staker implementation
  withdrawalTimestamp?: number | null;
}

export interface ATPBeneficiaryResponse {
  data: ATPPosition[];
}
