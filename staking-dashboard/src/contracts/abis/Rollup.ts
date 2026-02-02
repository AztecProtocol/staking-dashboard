export const RollupAbi = [
  {
    "type": "function",
    "name": "getExitDelay",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "Timestamp"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVersion",
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
    "name": "getActivationThreshold",
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
    "name": "getLocalEjectionThreshold",
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
    "name": "getRewardConfig",
    "inputs": [],
    "outputs": [
      {
        "components": [
          {
            "name": "rewardDistributor",
            "type": "address",
            "internalType": "contract IRewardDistributor"
          },
          {
            "name": "sequencerBps",
            "type": "uint16",
            "internalType": "Bps"
          },
          {
            "name": "booster",
            "type": "address",
            "internalType": "contract IBoosterCore"
          },
          {
            "name": "blockReward",
            "type": "uint96",
            "internalType": "uint96"
          }
        ],
        "name": "",
        "type": "tuple",
        "internalType": "struct RewardConfig"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSequencerRewards",
    "inputs": [
      {
        "name": "_sequencer",
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
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimSequencerRewards",
    "inputs": [
      {
        "name": "_coinbase",
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
    "name": "isRewardsClaimable",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initiateWithdraw",
    "inputs": [
      {
        "name": "_attester",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_recipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "finalizeWithdraw",
    "inputs": [
      {
        "name": "_attester",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "_attester",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_withdrawer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_publicKeyG1",
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
        "name": "_publicKeyG2",
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
        "name": "_signature",
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
        "name": "_moveWithRollup",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAttesterView",
    "inputs": [
      {
        "name": "_attester",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "status",
            "type": "uint8"
          },
          {
            "name": "effectiveBalance",
            "type": "uint256"
          },
          {
            "name": "exit",
            "type": "tuple",
            "components": [
              {
                "name": "withdrawalId",
                "type": "uint256"
              },
              {
                "name": "amount",
                "type": "uint256"
              },
              {
                "name": "exitableAt",
                "type": "uint256"
              },
              {
                "name": "recipientOrWithdrawer",
                "type": "address"
              },
              {
                "name": "isRecipient",
                "type": "bool"
              },
              {
                "name": "exists",
                "type": "bool"
              }
            ]
          },
          {
            "name": "config",
            "type": "tuple",
            "components": [
              {
                "name": "publicKey",
                "type": "tuple",
                "components": [
                  {
                    "name": "x",
                    "type": "uint256"
                  },
                  {
                    "name": "y",
                    "type": "uint256"
                  }
                ]
              },
              {
                "name": "withdrawer",
                "type": "address"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const
