export const AtpRegistryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "__owner",
        "type": "address",
        "internalType": "address"
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
    "name": "addMilestone",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getExecuteAllowedAt",
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
    "name": "getGlobalLockParams",
    "inputs": [],
    "outputs": [
      {
        "name": "",
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
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMilestoneStatus",
    "inputs": [
      {
        "name": "_milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum MilestoneStatus"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNextMilestoneId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNextStakerVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "StakerVersion"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRevoker",
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
    "name": "getRevokerOperator",
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
    "name": "getStakerImplementation",
    "inputs": [
      {
        "name": "_version",
        "type": "uint256",
        "internalType": "StakerVersion"
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
    "name": "getUnlockStartTime",
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
    "name": "registerStakerImplementation",
    "inputs": [
      {
        "name": "_implementation",
        "type": "address",
        "internalType": "address"
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
    "name": "setExecuteAllowedAt",
    "inputs": [
      {
        "name": "_executeAllowedAt",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMilestoneStatus",
    "inputs": [
      {
        "name": "_milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      },
      {
        "name": "_status",
        "type": "uint8",
        "internalType": "enum MilestoneStatus"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRevoker",
    "inputs": [
      {
        "name": "_revoker",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRevokerOperator",
    "inputs": [
      {
        "name": "_revokerOperator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setUnlockStartTime",
    "inputs": [
      {
        "name": "_unlockStartTime",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "MilestoneAdded",
    "inputs": [
      {
        "name": "milestoneId",
        "type": "uint96",
        "indexed": false,
        "internalType": "MilestoneId"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MilestoneStatusUpdated",
    "inputs": [
      {
        "name": "milestoneId",
        "type": "uint96",
        "indexed": false,
        "internalType": "MilestoneId"
      },
      {
        "name": "status",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum MilestoneStatus"
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
    "type": "event",
    "name": "StakerRegistered",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "StakerVersion"
      },
      {
        "name": "implementation",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpdatedExecuteAllowedAt",
    "inputs": [
      {
        "name": "executeAllowedAt",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpdatedRevoker",
    "inputs": [
      {
        "name": "revoker",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpdatedRevokerOperator",
    "inputs": [
      {
        "name": "revokerOperator",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpdatedUnlockStartTime",
    "inputs": [
      {
        "name": "unlockStartTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InvalidExecuteAllowedAt",
    "inputs": [
      {
        "name": "newExecuteAllowedAt",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentExecuteAllowedAt",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidMilestoneId",
    "inputs": [
      {
        "name": "milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidMilestoneStatus",
    "inputs": [
      {
        "name": "milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidStakerImplementation",
    "inputs": [
      {
        "name": "implementation",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidUnlockCliffDuration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidUnlockDuration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidUnlockStartTime",
    "inputs": [
      {
        "name": "newUnlockStartTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentUnlockStartTime",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
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
    "name": "UnRegisteredStaker",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "internalType": "StakerVersion"
      }
    ]
  }
] as const
