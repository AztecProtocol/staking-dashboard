// Mock exports for ponder:schema
// Only mocking what's actually used in tests

export const deposit = 'deposit';
export const failedDeposit = 'failedDeposit';
export const withdrawFinalized = {
  attesterAddress: 'attesterAddress',
  recipientAddress: 'recipientAddress',
  timestamp: 'timestamp',
  blockNumber: 'blockNumber',
  logIndex: 'logIndex',
  txHash: 'txHash'
};
export const atpPosition = {
  address: 'address',
  stakerAddress: 'stakerAddress'
};
