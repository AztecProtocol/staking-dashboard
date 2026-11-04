/**
 * Governance Staking Escrow (GSE) ABI
 *
 * The GSE holds the stake of every VALIDATING attester, across all rollup
 * versions. `effectiveBalanceOf(rollup, attester)` also resolves attesters
 * that follow the latest rollup through the bonus instance.
 */
export const GSE_ABI = [
  {
    type: 'function',
    name: 'effectiveBalanceOf',
    inputs: [
      { name: '_instance', type: 'address' },
      { name: '_attester', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
