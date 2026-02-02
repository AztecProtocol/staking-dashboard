export const ATPFactoryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "__owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_token",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_unlockCliffDuration",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_unlockLockDuration",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createLATP",
    "inputs": [
      {
        "name": "_beneficiary",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_allocation",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_revokableParams",
        "type": "tuple",
        "internalType": "struct RevokableParams",
        "components": [
          {
            "name": "revokeBeneficiary",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "lockParams",
            "type": "tuple",
            "internalType": "struct LockParams",
            "components": [
              {
                "name": "startTime",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "cliffDuration",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "lockDuration",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract ILATP"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createLATPs",
    "inputs": [
      {
        "name": "_beneficiaries",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_allocations",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_revokableParams",
        "type": "tuple[]",
        "internalType": "struct RevokableParams[]",
        "components": [
          {
            "name": "revokeBeneficiary",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "lockParams",
            "type": "tuple",
            "internalType": "struct LockParams",
            "components": [
              {
                "name": "startTime",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "cliffDuration",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "lockDuration",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "contract ILATP[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMATP",
    "inputs": [
      {
        "name": "_beneficiary",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_allocation",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IMATP"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMATPs",
    "inputs": [
      {
        "name": "_beneficiaries",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_allocations",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_milestoneIds",
        "type": "uint96[]",
        "internalType": "MilestoneId[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "contract IMATP[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRegistry",
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
    "name": "getToken",
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
    "name": "minter",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
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
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "predictLATPAddress",
    "inputs": [
      {
        "name": "_beneficiary",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_allocation",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_revokableParams",
        "type": "tuple",
        "internalType": "struct RevokableParams",
        "components": [
          {
            "name": "revokeBeneficiary",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "lockParams",
            "type": "tuple",
            "internalType": "struct LockParams",
            "components": [
              {
                "name": "startTime",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "cliffDuration",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "lockDuration",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "predictMATPAddress",
    "inputs": [
      {
        "name": "_beneficiary",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_allocation",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "recoverTokens",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMinter",
    "inputs": [
      {
        "name": "_minter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_isMinter",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ATPCreated",
    "inputs": [
      {
        "name": "beneficiary",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "atp",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "allocation",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferStarted",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "FailedDeployment",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": [
      {
        "name": "balance",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "needed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidInputLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotMinter",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
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
  }
] as const
