export const GenesisSequencerSale = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_atpFactory",
        "type": "address",
        "internalType": "contract IATPFactory"
      },
      {
        "name": "_saleToken",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_soulboundToken",
        "type": "address",
        "internalType": "contract IIgnitionParticipantSoulbound"
      },
      {
        "name": "_rollup",
        "type": "address",
        "internalType": "contract IStaking"
      },
      {
        "name": "_milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      },
      {
        "name": "_pricePerLot",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_saleStartTime",
        "type": "uint96",
        "internalType": "uint96"
      },
      {
        "name": "_saleEndTime",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ATP_FACTORY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IATPFactory"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "PURCHASES_PER_ADDRESS",
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
    "name": "SALE_TOKEN",
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
    "name": "SALE_TOKEN_PURCHASE_AMOUNT",
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
    "name": "SOULBOUND_TOKEN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IIgnitionParticipantSoulbound"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "TOKEN_LOT_SIZE",
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
    "name": "getPurchaseCostInEth",
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
    "name": "hasPurchased",
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
    "name": "isSaleActive",
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
    "name": "milestoneId",
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
    "name": "pricePerLot",
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
    "name": "purchase",
    "inputs": [
      {
        "name": "_atpBeneficiary",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "purchaseAndMintSoulboundToken",
    "inputs": [
      {
        "name": "_atpBeneficiary",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_merkleProof",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      },
      {
        "name": "_identityProvider",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_identityData",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_soulboundRecipientScreeningData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
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
    "name": "saleEnabled",
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
    "name": "saleEndTime",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "saleStartTime",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setMilestoneId",
    "inputs": [
      {
        "name": "_milestoneId",
        "type": "uint96",
        "internalType": "MilestoneId"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPricePerLotInEth",
    "inputs": [
      {
        "name": "_pricePerLot",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setSaleTimes",
    "inputs": [
      {
        "name": "_saleStartTime",
        "type": "uint96",
        "internalType": "uint96"
      },
      {
        "name": "_saleEndTime",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "startSale",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "stopSale",
    "inputs": [],
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
    "type": "function",
    "name": "withdrawETH",
    "inputs": [
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
    "name": "withdrawTokens",
    "inputs": [
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_token",
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
    "type": "event",
    "name": "ETHWithdrawn",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MilestoneIdUpdated",
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
    "name": "PriceUpdated",
    "inputs": [
      {
        "name": "newPrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SaleStarted",
    "inputs": [
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SaleStopped",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SaleTimesUpdated",
    "inputs": [
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SaleTokensPurchased",
    "inputs": [
      {
        "name": "beneficiary",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
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
        "name": "purchaseCostInEth",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TokensWithdrawn",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__AlreadyPurchased",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__ETHTransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__IncorrectETH",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__InvalidPrice",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__InvalidTimeRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__NoSoulboundToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__SaleHasEnded",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__SaleNotEnabled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__SaleNotStarted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GenesisSequencerSale__ZeroAddress",
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
    "name": "ReentrancyGuardReentrantCall",
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
  }
] as const
