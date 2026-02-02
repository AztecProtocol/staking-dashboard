import type { ATPData } from "@/hooks/atp/atpTypes"
import type { RawKeystoreData } from "@/types/keystore"
import type { TransactionType, DelegationMetadata, SelfStakeMetadata } from "@/contexts/TransactionCartContext"
import type { ProviderDetail } from "@/hooks/providers/useProviderDetail"
import type { Address } from "viem"

/**
 * Base discriminator for staking source selection
 */
export type StakingSourceType = "wallet" | "vault"

/**
 * Base form data shared across all ATP staking flows
 * Contains only the common fields needed for all staking operations
 */
export interface BaseStakingForm {
  // General staking flow
  selectedAtp: ATPData | null
  selectedStakerVersion: bigint | null
  selectedOperator: Address | null
  isTokenApproved: boolean
  isStakerUpgraded: boolean
  isOperatorConfigured: boolean
  approvalAmount: bigint | null

  // Transaction batch
  transactionType: Extract<TransactionType, "self-stake" | "delegation">
  transactionMetadata?: DelegationMetadata | SelfStakeMetadata

  // StakeFlowCountModal
  stakeCount: number
  maxStakesCount?: number
}

/**
 * Validator registration specific form data
 * Extends base with registration-only fields
 */
export interface ValidatorRegistrationForm extends BaseStakingForm {
  uploadedKeystores: RawKeystoreData[]
  validatorRunningConfirmed: boolean
}

/**
 * Provider delegation specific form data
 * Extends base with provider-specific fields
 */
export interface ProviderDelegationForm extends BaseStakingForm {
  selectedProvider: ProviderDetail 
}
