export const GSEAbi = [
  {
    type: "function",
    name: "getDelegatee",
    inputs: [
      { name: "_instance", type: "address", internalType: "address" },
      { name: "_attester", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVotingPower",
    inputs: [{ name: "_attester", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVotingPowerAt",
    inputs: [
      { name: "_attester", type: "address", internalType: "address" },
      { name: "_timestamp", type: "uint256", internalType: "Timestamp" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPowerUsed",
    inputs: [
      { name: "_delegatee", type: "address", internalType: "address" },
      { name: "_proposalId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "_proposalId", type: "uint256", internalType: "uint256" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      { name: "_support", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLatestRollup",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBonusInstanceAddress",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [
      { name: "_instance", type: "address", internalType: "address" },
      { name: "_attester", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;
