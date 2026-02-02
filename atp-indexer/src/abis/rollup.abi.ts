/**
 * Rollup Contract ABIs
 */

/**
 * Rollup contract read functions
 */
export const ROLLUP_FUNCTIONS = [
  {
    inputs: [],
    name: 'getActivationThreshold',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRewardConfig',
    outputs: [
      {
        components: [
          { name: 'rewardDistributor', type: 'address' },
          { name: 'sequencerBps', type: 'uint16' },
          { name: 'booster', type: 'address' },
          { name: 'blockReward', type: 'uint96' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getSlotDuration',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveAttesterCount',
    outputs: [
      {
        name: '',
        type: 'uint256',
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEntryQueueLength',
    outputs: [
      {
        name: '',
        type: 'uint256',
      }
    ],
    stateMutability: 'view',
    type: 'function',
  }
] as const;

/**
 * Event emitted when a validator successfully deposits
 */
export const DepositEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'attester', type: 'address' },
    { indexed: true, name: 'withdrawer', type: 'address' },
    {
      indexed: false,
      name: 'publicKeyInG1',
      type: 'tuple',
      components: [
        { name: 'x', type: 'uint256' },
        { name: 'y', type: 'uint256' },
      ],
    },
    {
      indexed: false,
      name: 'publicKeyInG2',
      type: 'tuple',
      components: [
        { name: 'x0', type: 'uint256' },
        { name: 'x1', type: 'uint256' },
        { name: 'y0', type: 'uint256' },
        { name: 'y1', type: 'uint256' },
      ],
    },
    {
      indexed: false,
      name: 'proofOfPossession',
      type: 'tuple',
      components: [
        { name: 'x', type: 'uint256' },
        { name: 'y', type: 'uint256' },
      ],
    },
    { indexed: false, name: 'amount', type: 'uint256' },
  ],
  name: 'Deposit',
  type: 'event',
} as const;

/**
 * Event emitted when a validator deposit fails
 */
export const FailedDepositEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'attester', type: 'address' },
    { indexed: true, name: 'withdrawer', type: 'address' },
    {
      indexed: false,
      name: 'publicKeyInG1',
      type: 'tuple',
      components: [
        { name: 'x', type: 'uint256' },
        { name: 'y', type: 'uint256' },
      ],
    },
    {
      indexed: false,
      name: 'publicKeyInG2',
      type: 'tuple',
      components: [
        { name: 'x0', type: 'uint256' },
        { name: 'x1', type: 'uint256' },
        { name: 'y0', type: 'uint256' },
        { name: 'y1', type: 'uint256' },
      ],
    },
    {
      indexed: false,
      name: 'proofOfPossession',
      type: 'tuple',
      components: [
        { name: 'x', type: 'uint256' },
        { name: 'y', type: 'uint256' },
      ],
    },
  ],
  name: 'FailedDeposit',
  type: 'event',
} as const;

/**
 * Event emitted when a withdrawal is initiated
 */
export const WithdrawInitiatedEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'attester', type: 'address' },
    { indexed: true, name: 'recipient', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
  ],
  name: 'WithdrawInitiated',
  type: 'event',
} as const;

/**
 * Event emitted when a withdrawal is finalized
 */
export const WithdrawFinalizedEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'attester', type: 'address' },
    { indexed: true, name: 'recipient', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
  ],
  name: 'WithdrawFinalized',
  type: 'event',
} as const;

/**
 * Event emitted when an attester is slashed
 */
export const SlashedEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'attester', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
  ],
  name: 'Slashed',
  type: 'event',
} as const;

/**
 * Combined Rollup ABI for contract configuration
 */
export const ROLLUP_ABI = [
  ...ROLLUP_FUNCTIONS,
  DepositEventAbi,
  FailedDepositEventAbi,
  WithdrawInitiatedEventAbi,
  WithdrawFinalizedEventAbi,
  SlashedEventAbi,
] as const;
