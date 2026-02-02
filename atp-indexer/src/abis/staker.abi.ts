/**
 * Staker Contract ABIs
 */

/**
 * Event emitted when staker stakes directly with an attester
 */
export const StakedEventAbi = {
  type: 'event',
  name: 'Staked',
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: 'staker',
      type: 'address',
      internalType: 'address',
    },
    {
      indexed: true,
      name: 'attester',
      type: 'address',
      internalType: 'address',
    },
    {
      indexed: true,
      name: 'rollup',
      type: 'address',
      internalType: 'address',
    }
  ],
} as const;

/**
 * Event emitted when tokens are withdrawn to beneficiary
 */
export const TokensWithdrawnToBeneficiaryEventAbi = {
  type: 'event',
  name: 'TokensWithdrawnToBeneficiary',
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: 'beneficiary',
      type: 'address',
      internalType: 'address',
    },
    {
      indexed: false,
      name: 'amount',
      type: 'uint256',
      internalType: 'uint256',
    }
  ],
} as const;

/**
 * Combined Staker ABI for contract configuration
 */
export const STAKER_ABI = [
  StakedEventAbi,
  TokensWithdrawnToBeneficiaryEventAbi,
] as const;
