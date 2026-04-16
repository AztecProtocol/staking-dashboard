// Aztec governance Registry (IRegistry).
// Source: aztec-packages next branch @ commit 9f7257e619 — l1-contracts/src/governance/interfaces/IRegistry.sol
// Discovered at runtime via stakingRegistry.ROLLUP_REGISTRY(); no env var required.
export const RollupRegistryAbi = [
  {
    "type": "function",
    "name": "getCanonicalRollup",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IHaveVersion"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRollup",
    "inputs": [
      {
        "name": "_chainId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IHaveVersion"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "numberOfVersions",
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
    "name": "getVersion",
    "inputs": [
      {
        "name": "_index",
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
    "name": "getGovernance",
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
    "name": "getRewardDistributor",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IRewardDistributor"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CanonicalRollupUpdated",
    "inputs": [
      {
        "name": "instance",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "version",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardDistributorUpdated",
    "inputs": [
      {
        "name": "rewardDistributor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  }
] as const
