export interface StakeWithProviderReward {
  providerId?: number
  splitContract: string
  totalRewards: bigint
  userRewards: bigint
  takeRate: number
}

export interface G1Point {
  x: string
  y: string
}

export interface G2Point {
  x: [string, string]
  y: [string, string]
}
