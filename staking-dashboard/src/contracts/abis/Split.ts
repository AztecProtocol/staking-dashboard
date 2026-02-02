export const SplitAbi = [
  {
    "type": "function",
    "name": "distribute",
    "inputs": [
      {
        "name": "_split",
        "type": "tuple",
        "components": [
          {"name": "recipients", "type": "address[]"},
          {"name": "allocations", "type": "uint256[]"},
          {"name": "totalAllocation", "type": "uint256"},
          {"name": "distributionIncentive", "type": "uint16"}
        ]
      },
      {"name": "_token", "type": "address"},
      {"name": "_distributor", "type": "address"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "splitHash",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "SPLITS_WAREHOUSE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  }
] as const
