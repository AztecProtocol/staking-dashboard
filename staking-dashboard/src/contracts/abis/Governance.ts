export const GovernanceAbi = [
  // Read functions
  {
    type: "function",
    name: "proposalCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getConfiguration",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DataStructures.Configuration",
        components: [
          {
            name: "proposeConfig",
            type: "tuple",
            internalType: "struct DataStructures.ProposeWithLockConfiguration",
            components: [
              { name: "lockDelay", type: "uint256", internalType: "Timestamp" },
              { name: "lockAmount", type: "uint256", internalType: "uint256" },
            ],
          },
          { name: "votingDelay", type: "uint256", internalType: "Timestamp" },
          { name: "votingDuration", type: "uint256", internalType: "Timestamp" },
          { name: "executionDelay", type: "uint256", internalType: "Timestamp" },
          { name: "gracePeriod", type: "uint256", internalType: "Timestamp" },
          { name: "quorum", type: "uint256", internalType: "uint256" },
          { name: "requiredYeaMargin", type: "uint256", internalType: "uint256" },
          { name: "minimumVotes", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawalCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalPowerNow",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalPowerAt",
    inputs: [{ name: "_timestamp", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "powerNow",
    inputs: [{ name: "_owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "powerAt",
    inputs: [
      { name: "_owner", type: "address", internalType: "address" },
      { name: "_ts", type: "uint256", internalType: "Timestamp" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProposal",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DataStructures.ProposalData",
        components: [
          {
            name: "configuration",
            type: "tuple",
            internalType: "struct DataStructures.Configuration",
            components: [
              { name: "votingDelay", type: "uint256", internalType: "Timestamp" },
              { name: "votingDuration", type: "uint256", internalType: "Timestamp" },
              { name: "executionDelay", type: "uint256", internalType: "Timestamp" },
              { name: "gracePeriod", type: "uint256", internalType: "Timestamp" },
              { name: "quorum", type: "uint256", internalType: "uint256" },
              { name: "voteDifferential", type: "uint256", internalType: "uint256" },
              { name: "minimumVotes", type: "uint256", internalType: "uint256" },
            ],
          },
          { name: "state", type: "uint8", internalType: "enum DataStructures.ProposalState" },
          { name: "payload", type: "address", internalType: "contract IPayload" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "creation", type: "uint256", internalType: "Timestamp" },
          {
            name: "summedBallot",
            type: "tuple",
            internalType: "struct DataStructures.Ballot",
            components: [
              { name: "yea", type: "uint256", internalType: "uint256" },
              { name: "nay", type: "uint256", internalType: "uint256" },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProposalState",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint8", internalType: "enum DataStructures.ProposalState" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBallot",
    inputs: [
      { name: "_proposalId", type: "uint256", internalType: "uint256" },
      { name: "_voter", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DataStructures.Ballot",
        components: [
          { name: "yea", type: "uint256", internalType: "uint256" },
          { name: "nay", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWithdrawal",
    inputs: [{ name: "_withdrawalId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Withdrawal",
        components: [
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "unlocksAt", type: "uint256", internalType: "Timestamp" },
          { name: "recipient", type: "address", internalType: "address" },
          { name: "claimed", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // Write functions
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "_onBehalfOf", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "initiateWithdraw",
    inputs: [
      { name: "_to", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeWithdraw",
    inputs: [{ name: "_withdrawalId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "execute",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Events
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "depositor", type: "address", indexed: true, internalType: "address" },
      { name: "onBehalfOf", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "voter", type: "address", indexed: true, internalType: "address" },
      { name: "support", type: "bool", indexed: false, internalType: "bool" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "WithdrawInitiated",
    inputs: [
      { name: "withdrawalId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "WithdrawFinalized",
    inputs: [
      { name: "withdrawalId", type: "uint256", indexed: true, internalType: "uint256" },
    ],
  },
] as const;
