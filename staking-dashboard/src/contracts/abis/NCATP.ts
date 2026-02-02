import { LATPAbi } from './LATP'

/**
 * NCATP (Non-Claimable ATP) ABI
 * Extends LATP with CREATED_AT_TIMESTAMP field
 */
export const NCATPAbi = [
  ...LATPAbi,
  {
    "type": "function",
    "name": "CREATED_AT_TIMESTAMP",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
] as const
