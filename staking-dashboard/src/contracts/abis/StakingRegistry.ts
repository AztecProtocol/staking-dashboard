export const StakingRegistryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_stakingAsset",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_pullSplitFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_rollupRegistry",
        "type": "address",
        "internalType": "contract IRegistry"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "PULL_SPLIT_FACTORY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract PullSplitFactory"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ROLLUP_REGISTRY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "STAKING_ASSET",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptProviderAdmin",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addKeysToProvider",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_keyStores",
        "type": "tuple[]",
        "internalType": "struct IStakingRegistry.KeyStore[]",
        "components": [
          {
            "name": "attester",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "publicKeyG1",
            "type": "tuple",
            "internalType": "struct BN254Lib.G1Point",
            "components": [
              {
                "name": "x",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "publicKeyG2",
            "type": "tuple",
            "internalType": "struct BN254Lib.G2Point",
            "components": [
              {
                "name": "x0",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "x1",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y0",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y1",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "signature",
            "type": "tuple",
            "internalType": "struct BN254Lib.G1Point",
            "components": [
              {
                "name": "x",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "dripProviderQueue",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_numberOfKeysToDrip",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getActivationThreshold",
    "inputs": [
      {
        "name": "_rollupVersion",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFirstIndexInQueue",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLastIndexInQueue",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProviderQueueLength",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getValueAtIndexInQueue",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_index",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct IStakingRegistry.KeyStore",
        "components": [
          {
            "name": "attester",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "publicKeyG1",
            "type": "tuple",
            "internalType": "struct BN254Lib.G1Point",
            "components": [
              {
                "name": "x",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "publicKeyG2",
            "type": "tuple",
            "internalType": "struct BN254Lib.G2Point",
            "components": [
              {
                "name": "x0",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "x1",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y0",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y1",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "signature",
            "type": "tuple",
            "internalType": "struct BN254Lib.G1Point",
            "components": [
              {
                "name": "x",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "y",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextProviderIdentifier",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingProviderAdmins",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "providerAdmin",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "providerConfigurations",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "providerAdmin",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "providerTakeRate",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "providerRewardsRecipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "providerQueues",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "first",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "last",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerProvider",
    "inputs": [
      {
        "name": "_providerAdmin",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_providerTakeRate",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "_providerRewardsRecipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "stake",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_rollupVersion",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_withdrawalAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_expectedProviderTakeRate",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "_userRewardsRecipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_moveWithLatestRollup",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateProviderAdmin",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_newAdmin",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateProviderRewardsRecipient",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_newRewardsRecipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateProviderTakeRate",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_newTakeRate",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AttestersAddedToProvider",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "attesters",
        "type": "address[]",
        "indexed": false,
        "internalType": "address[]"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProviderAdminUpdateInitiated",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProviderAdminUpdated",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProviderQueueDripped",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "attester",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProviderRegistered",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "providerAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "providerTakeRate",
        "type": "uint16",
        "indexed": true,
        "internalType": "uint16"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProviderRewardsRecipientUpdated",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newRewardsRecipient",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProviderTakeRateUpdated",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newTakeRate",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakedWithProvider",
    "inputs": [
      {
        "name": "providerIdentifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "rollupAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "attester",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "coinbaseSplitContractAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "stakerAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "QueueIsEmpty",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "StakingRegistry__InvalidProviderIdentifier",
    "inputs": [
      {
        "name": "_providerIdentifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "StakingRegistry__InvalidTakeRate",
    "inputs": [
      {
        "name": "_takeRate",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "StakingRegistry__NotPendingProviderAdmin",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakingRegistry__NotProviderAdmin",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakingRegistry__UnexpectedTakeRate",
    "inputs": [
      {
        "name": "_expectedTakeRate",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_gotTakeRate",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "StakingRegistry__UpdatedProviderAdminToSameAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakingRegistry__UpdatedProviderTakeRateToSameValue",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakingRegistry__ZeroAddress",
    "inputs": []
  }
] as const
