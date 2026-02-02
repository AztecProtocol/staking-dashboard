/**
 * Staking Registry Contract ABIs
 */

/**
 * Function to get provider configuration
 */
export const STAKING_REGISTRY_FUNCTIONS = [
  {
    inputs: [],
    name: "STAKING_ASSET",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    type: "function",
    name: "providerConfigurations",
    inputs: [
      {
        name: "providerIdentifier",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "providerAdmin",
        type: "address",
        internalType: "address"
      },
      {
        name: "providerTakeRate",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "providerRewardsRecipient",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  }
] as const;

/**
 * Event emitted when staker stakes with a provider
 */
export const StakedWithProviderEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: true,
      name: "rollupAddress",
      type: "address"
    },
    {
      indexed: true,
      name: "attester",
      type: "address"
    },
    {
      indexed: false,
      name: "coinbaseSplitContractAddress",
      type: "address"
    },
    {
      indexed: false,
      name: "stakerAddress",
      type: "address"
    }
  ],
  name: "StakedWithProvider",
  type: "event"
} as const;

/**
 * Event emitted when attesters are added to a provider
 */
export const AttestersAddedToProviderEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: false,
      name: "attesters",
      type: "address[]"
    }
  ],
  name: "AttestersAddedToProvider",
  type: "event"
} as const;

/**
 * Event emitted when a new provider is registered
 */
export const ProviderRegisteredEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: true,
      name: "providerAdmin",
      type: "address"
    },
    {
      indexed: true,
      name: "providerTakeRate",
      type: "uint16"
    }
  ],
  name: "ProviderRegistered",
  type: "event"
} as const;

/**
 * Event emitted when provider queue is dripped
 */
export const ProviderQueueDrippedEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: true,
      name: "attester",
      type: "address"
    }
  ],
  name: "ProviderQueueDripped",
  type: "event"
} as const;

/**
 * Event emitted when provider take rate is updated
 */
export const ProviderTakeRateUpdatedEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: false,
      name: "newTakeRate",
      type: "uint16"
    }
  ],
  name: "ProviderTakeRateUpdated",
  type: "event"
} as const;

/**
 * Event emitted when provider rewards recipient is updated
 */
export const ProviderRewardsRecipientUpdatedEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: true,
      name: "newRewardsRecipient",
      type: "address"
    }
  ],
  name: "ProviderRewardsRecipientUpdated",
  type: "event"
} as const;

/**
 * Event emitted when provider admin update is initiated
 */
export const ProviderAdminUpdateInitiatedEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: true,
      name: "newAdmin",
      type: "address"
    }
  ],
  name: "ProviderAdminUpdateInitiated",
  type: "event"
} as const;

/**
 * Event emitted when provider admin is updated
 */
export const ProviderAdminUpdatedEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "providerIdentifier",
      type: "uint256"
    },
    {
      indexed: true,
      name: "newAdmin",
      type: "address"
    }
  ],
  name: "ProviderAdminUpdated",
  type: "event"
} as const;

/**
 * Combined Staking Registry ABI for contract configuration
 */
export const STAKING_REGISTRY_ABI = [
  ...STAKING_REGISTRY_FUNCTIONS,
  StakedWithProviderEventAbi,
  AttestersAddedToProviderEventAbi,
  ProviderRegisteredEventAbi,
  ProviderQueueDrippedEventAbi,
  ProviderTakeRateUpdatedEventAbi,
  ProviderRewardsRecipientUpdatedEventAbi,
  ProviderAdminUpdateInitiatedEventAbi,
  ProviderAdminUpdatedEventAbi,
] as const;
