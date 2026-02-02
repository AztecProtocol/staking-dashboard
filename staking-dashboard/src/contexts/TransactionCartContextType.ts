import type { Address } from "viem"
import { ATPStakingStepsWithTransaction } from "./ATPStakingStepsContext"

export type TransactionType = "delegation" | "self-stake" | "setup" | "wallet-delegation" | "wallet-direct-stake"

export interface TransactionDependency<T> {
  stepType: T
  stepName?: string
  stepGroupIdentifier: string
}

export interface BaseMetadata<T> {
  stepType?: T
  stepGroupIdentifier?: string
  dependsOn?: TransactionDependency<T>[]
}

export interface DelegationMetadata extends BaseMetadata<ATPStakingStepsWithTransaction> {
  providerId?: number
  providerName?: string
  atpAddress?: Address
  amount?: bigint
  stakeCount?: number
}

export interface SelfStakeMetadata extends BaseMetadata<ATPStakingStepsWithTransaction> {
  atpAddress?: Address
  amount?: bigint
  operatorAddress?: Address
  stakeCount?: number
}

export interface SetupMetadata extends BaseMetadata<ATPStakingStepsWithTransaction> {
  atpAddress?: Address
  operatorAddress?: Address
  stakeCount?: number
}

export interface WalletDelegationMetadata extends BaseMetadata<ATPStakingStepsWithTransaction> {
  providerId?: number
  providerName?: string
  amount?: bigint
  stakeCount?: number
  walletAddress?: Address
  atpAddress?: Address // Not used for wallet delegation, but needed for type compatibility
}

export interface WalletDirectStakeMetadata extends BaseMetadata<ATPStakingStepsWithTransaction> {
  amount?: bigint
  stakeCount?: number
  walletAddress?: Address
  attesterAddress?: Address
  atpAddress?: Address // Not used for wallet direct staking, but needed for type compatibility
}

export interface RawTransaction {
  to: Address
  data: `0x${string}`
  value: bigint
}

export type TransactionStatus = 'pending' | 'executing' | 'completed' | 'failed'

interface BaseCartItem<T extends TransactionType, M> {
  id: string
  type: T
  label: string
  description?: string
  transaction: RawTransaction
  metadata?: M
  status?: TransactionStatus
  txHash?: string
  safeTxHash?: string
  error?: string
}

export type CartTransaction =
  | BaseCartItem<"delegation", DelegationMetadata>
  | BaseCartItem<"self-stake", SelfStakeMetadata>
  | BaseCartItem<"setup", SetupMetadata>
  | BaseCartItem<"wallet-delegation", WalletDelegationMetadata>
  | BaseCartItem<"wallet-direct-stake", WalletDirectStakeMetadata>

export interface AddTransactionOptions {
  preventDuplicate?: boolean
}

export interface TransactionCartContextType {
  transactions: CartTransaction[]
  addTransaction: (transaction: Omit<CartTransaction, "id">, options?: AddTransactionOptions) => void
  removeTransaction: (id: string) => void
  clearCart: () => void
  clearByType: (type: TransactionType) => void
  clearCompleted: () => void
  executeAll: () => Promise<void>
  isExecuting: boolean
  currentExecutingId: string | null
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  checkTransactionInQueue: (transaction: RawTransaction) => boolean
  getTransaction: (id: string) => CartTransaction | undefined
  getTransactionByTx: (transaction: RawTransaction) => CartTransaction | undefined
  isSafe: boolean
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}
