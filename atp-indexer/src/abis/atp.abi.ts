/**
 * ATP (Allocation Token Position) Contract ABIs
 */

export enum ATPType {
  Linear = 0,
  Milestone = 1,
  NonClaim = 2
}

/**
 * Event emitted when a new ATP is created from factory
 */
export const ATPCreatedEventAbi = {
  type: 'event',
  name: 'ATPCreated',
  inputs: [
    {
      indexed: true,
      name: 'beneficiary',
      type: 'address',
      internalType: 'address',
    },
    {
      indexed: true,
      name: 'atp',
      type: 'address',
      internalType: 'contract IATP',
    },
    {
      indexed: false,
      name: 'allocation',
      type: 'uint256',
      internalType: 'uint256',
    },
  ],
} as const;

/**
 * Event emitted when staker operator is updated
 */
export const StakerOperatorUpdatedEventAbi = {
  type: 'event',
  name: 'StakerOperatorUpdated',
  anonymous: false,
  inputs: [
    {
      indexed: false,
      name: '_operator',
      type: 'address',
      internalType: 'address',
    }
  ],
} as const;

/**
 * Event emitted when tokens are claimed from ATP
 */
export const ClaimedEventAbi = {
  type: 'event',
  name: 'Claimed',
  anonymous: false,
  inputs: [
    {
      indexed: false,
      name: 'amount',
      type: 'uint256',
      internalType: 'uint256',
    },
  ],
} as const;

/**
 * Function to get ATP type (MATP, LATP, or NCATP)
 */
export const ATP_GET_TYPE_ABI = [
  {
    type: 'function',
    name: 'getType',
    inputs: [],
    outputs: [{ type: 'uint8', name: '', internalType: 'enum ATPType' }],
    stateMutability: 'view',
  },
] as const;

/**
 * Function to get staker contract address from ATP
 */
export const ATP_GET_STAKER_ABI = [
  {
    type: 'function',
    name: 'getStaker',
    inputs: [],
    outputs: [{ type: 'address', name: '', internalType: 'contract IBaseStaker' }],
    stateMutability: 'view',
  },
] as const;

/**
 * Combined ATP ABI for contract configuration
 */
export const ATP_ABI = [
  ATPCreatedEventAbi,
  StakerOperatorUpdatedEventAbi,
  ClaimedEventAbi,
  ...ATP_GET_TYPE_ABI,
  ...ATP_GET_STAKER_ABI,
] as const;
