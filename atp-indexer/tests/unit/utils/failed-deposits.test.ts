import {
  markStakesWithFailedDeposits,
  fetchFailedDeposits,
  FailureReason
} from '../../../src/utils/failed-deposits';
import { deposit, failedDeposit, withdrawFinalized, atpPosition } from 'ponder:schema';

const createMockDb = (deposits: any[], failures: any[], withdrawals: any[] = []) => ({
  select: (fields?: any) => ({
    from: (table: any) => ({
      where: (condition?: any) => {
        if (table === deposit) return Promise.resolve(deposits);
        if (table === failedDeposit) return Promise.resolve(failures);
        return Promise.resolve([]);
      },
      leftJoin: (joinTable: any, condition: any) => ({
        where: (condition?: any) => {
          // Return withdrawals (should already include stakerAddress from left join)
          return Promise.resolve(withdrawals);
        }
      })
    })
  })
});

const ATTESTER_A = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const WITHDRAWER_B = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

describe('Stake Analysis Flow (Integration)', () => {

  /**
   * HELPER: Simulates the full flow
   * 1. Creates mock DB with provided events
   * 2. Calls fetchFailedDeposits using pairs derived from stakes
   * 3. Calls markStakesWithFailedDeposits
   */
  async function analyzeStakes(
    stakes: any[],
    dbDeposits: any[] = [],
    dbFailures: any[] = [],
    dbWithdrawals: any[] = []
  ) {
    const mockDb = createMockDb(dbDeposits, dbFailures, dbWithdrawals);

    const pairs = stakes.map(s => ({
      attesterAddress: s.attesterAddress,
      withdrawerAddress: s.stakerAddress
    }));

    const eventMap = await fetchFailedDeposits(pairs, mockDb as any);
    return markStakesWithFailedDeposits(stakes, eventMap);
  }

  describe('Standard Flows', () => {

    it('should mark a Stake as SUCCESS when a Deposit event follows it', async () => {
      const stakes = [{
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        timestamp: 100n, blockNumber: 100n, logIndex: 0
      }];

      const dbDeposits = [{
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B,
        timestamp: 105n, blockNumber: 105n, logIndex: 1, txHash: '0xSuccess'
      }];

      const results = await analyzeStakes(stakes, dbDeposits, []);

      expect(results[0].status).toBe('SUCCESS');
      expect(results[0].depositTxHash).toBe('0xSuccess');
      expect(results[0].hasFailedDeposit).toBe(false);
    });

    it('should mark a Stake as PENDING when no events exist', async () => {
      const stakes = [{
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        timestamp: 100n, blockNumber: 100n, logIndex: 0
      }];

      // DB is empty (Transaction pending or not indexed yet)
      const results = await analyzeStakes(stakes, [], []);

      expect(results[0].status).toBe('PENDING');
      expect(results[0].depositTxHash).toBeNull();
      expect(results[0].failedDepositTxHash).toBeNull();
    });

    it('should mark a Stake as FAILED (Invalid Key) when failed event follows with no history', async () => {
      const stakes = [{
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        timestamp: 100n, blockNumber: 100n, logIndex: 0
      }];

      const dbFailures = [{
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B,
        timestamp: 105n, blockNumber: 105n, logIndex: 1, txHash: '0xFail'
      }];

      const results = await analyzeStakes(stakes, [], dbFailures);

      expect(results[0].status).toBe('FAILED');
      expect(results[0].failureReason).toBe(FailureReason.INVALID_KEY);
      expect(results[0].failedDepositTxHash).toBe('0xFail');
    });
  });

  describe('Complex Sequences', () => {

    it('Sequence: Stake -> Success -> Stake -> Fail (Duplicate)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }, // Stake 1
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }  // Stake 2
      ];

      const dbDeposits = [
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xSuccess', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];
      const dbFailures = [
        { timestamp: 205n, blockNumber: 205n, logIndex: 0, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      // Stake 1: Success
      expect(results[0].status).toBe('SUCCESS');
      expect(results[0].depositTxHash).toBe('0xSuccess');

      // Stake 2: Failed (Duplicate because User is now Active)
      expect(results[1].status).toBe('FAILED');
      expect(results[1].failureReason).toBe(FailureReason.DUPLICATE);
    });

    it('Sequence: Stake -> Fail -> Stake -> Success (Redemption)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }, // Stake 1
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }  // Stake 2
      ];

      const dbFailures = [
        // First failure (Invalid Key because not active yet)
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];
      const dbDeposits = [
        // Then success
        { timestamp: 205n, blockNumber: 205n, logIndex: 0, txHash: '0xSuccess', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      // Stake 1: Failed (Invalid Key)
      expect(results[0].status).toBe('FAILED');
      expect(results[0].failureReason).toBe(FailureReason.INVALID_KEY);

      // Stake 2: Success
      expect(results[1].status).toBe('SUCCESS');
      expect(results[1].depositTxHash).toBe('0xSuccess');
    });

    it('Sequence: Stake -> Fail -> Stake -> Fail (Stubborn Invalid Key)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }
      ];

      const dbFailures = [
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xF1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        { timestamp: 205n, blockNumber: 205n, logIndex: 0, txHash: '0xF2', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const results = await analyzeStakes(stakes, [], dbFailures);

      // Both are Invalid Key because user never got in
      expect(results[0].status).toBe('FAILED');
      expect(results[0].failureReason).toBe(FailureReason.INVALID_KEY);

      expect(results[1].status).toBe('FAILED');
      expect(results[1].failureReason).toBe(FailureReason.INVALID_KEY);
    });
  });

  describe('Edge Cases', () => {

    it('should handle Same-Block & Transaction Conditions (Success First)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 1, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 100n, blockNumber: 100n, logIndex: 2, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 100n, blockNumber: 100n, logIndex: 3, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
      ];

      const dbDeposits = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 4, txHash: '0xSuccess', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];
      const dbFailures = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 6, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        // Should not be handled because its a past event
        { timestamp: 99n, blockNumber: 100n, logIndex: 7, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      // Stake A matches Deposit
      expect(results[0].status).toBe('SUCCESS');

      // Stake B matches Fail, Reason is DUPLICATE because Deposit happened at earlier index
      expect(results[1].status).toBe('FAILED');
      expect(results[1].failureReason).toBe(FailureReason.DUPLICATE);

      expect(results[2].status).toBe('PENDING');
    });

    it('should handle Same-Block & Transaction Conditions (Failure First)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 1, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 100n, blockNumber: 100n, logIndex: 2, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 100n, blockNumber: 100n, logIndex: 3, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
      ];

      const dbDeposits = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 6, txHash: '0xSuccess', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];
      const dbFailures = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 4, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        // Should not be handled because its a past event
        { timestamp: 99n, blockNumber: 100n, logIndex: 7, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      // Stake A matches Fail, Reason is INVALID KEY because Deposit never happened before
      expect(results[0].status).toBe('FAILED');
      expect(results[0].failureReason).toBe(FailureReason.INVALID_KEY);

      // Stake B matches Deposit
      expect(results[1].status).toBe('SUCCESS');

      expect(results[2].status).toBe('PENDING');
    });

    it('should isolate multiple pairs correctly', async () => {
      const ATTESTER_C = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      const WITHDRAWER_D = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_C, stakerAddress: WITHDRAWER_D }
      ];

      // AB Succeeds
      const dbDeposits = [{ timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xOK', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }];
      // CD Fails
      const dbFailures = [{ timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xNO', attesterAddress: ATTESTER_C, withdrawerAddress: WITHDRAWER_D }];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      const resAB = results.find(s => s.attesterAddress === ATTESTER_A)!;
      const resCD = results.find(s => s.attesterAddress === ATTESTER_C)!;

      expect(resAB.status).toBe('SUCCESS');
      expect(resCD.status).toBe('FAILED');
      expect(resCD.failureReason).toBe(FailureReason.INVALID_KEY); // Not affected by AB's success
    });

    it('should handle "Pending" state in a mixed sequence', async () => {
      // Stake 1 -> Success. Stake 2 -> No Event yet.
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }
      ];

      const dbDeposits = [{ timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xOK', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }];

      const results = await analyzeStakes(stakes, dbDeposits, []);

      expect(results[0].status).toBe('SUCCESS');
      expect(results[1].status).toBe('PENDING');
    });
  });

  describe('Mixed Stake Types (Direct + Delegation) - FIFO Event Consumption', () => {

    it('should consume events in FIFO order across different stake types', async () => {
      // Direct stake at block 100, Delegation at block 150, FailedDeposit at block 200
      // The FailedDeposit should match the Direct stake (earlier), not the Delegation
      const directStake = {
        timestamp: 100n, blockNumber: 100n, logIndex: 0,
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        _type: 'direct' as const
      };

      const delegation = {
        timestamp: 150n, blockNumber: 150n, logIndex: 0,
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        _type: 'delegation' as const
      };

      const dbFailures = [{
        timestamp: 200n, blockNumber: 200n, logIndex: 0,
        txHash: '0xFail',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      // Combine stakes as the fixed handlers now do
      const allStakes = [directStake, delegation];
      const results = await analyzeStakes(allStakes, [], dbFailures);

      // Direct stake should consume the FailedDeposit event
      const directResult = results.find(s => s._type === 'direct')!;
      const delegationResult = results.find(s => s._type === 'delegation')!;

      expect(directResult.status).toBe('FAILED');
      expect(directResult.failedDepositTxHash).toBe('0xFail');
      expect(directResult.failureReason).toBe(FailureReason.INVALID_KEY);

      // Delegation should remain PENDING (event already consumed)
      expect(delegationResult.status).toBe('PENDING');
      expect(delegationResult.failedDepositTxHash).toBeNull();
    });

    it('should match events to correct stake type when both exist at different times (Success)', async () => {
      // Delegation at block 100, Direct stake at block 200
      // Deposit at block 150 should match Delegation
      // Deposit at block 250 should match Direct stake
      const delegation = {
        timestamp: 100n, blockNumber: 100n, logIndex: 0,
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        _type: 'delegation' as const
      };

      const directStake = {
        timestamp: 200n, blockNumber: 200n, logIndex: 0,
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        _type: 'direct' as const
      };

      const dbDeposits = [
        { timestamp: 150n, blockNumber: 150n, logIndex: 0, txHash: '0xSuccess1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        { timestamp: 250n, blockNumber: 250n, logIndex: 0, txHash: '0xSuccess2', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const allStakes = [delegation, directStake];
      const results = await analyzeStakes(allStakes, dbDeposits, []);

      const delegationResult = results.find(s => s._type === 'delegation')!;
      const directResult = results.find(s => s._type === 'direct')!;

      expect(delegationResult.status).toBe('SUCCESS');
      expect(delegationResult.depositTxHash).toBe('0xSuccess1');

      expect(directResult.status).toBe('SUCCESS');
      expect(directResult.depositTxHash).toBe('0xSuccess2');
    });

    it('should handle mixed types with multiple stakes competing for same event', async () => {
      // Direct stake at 100, Delegation at 110, Direct stake at 120
      // Only ONE FailedDeposit at 200
      // First stake (Direct at 100) should consume it, others remain PENDING
      const stakes = [
        {
          timestamp: 100n, blockNumber: 100n, logIndex: 0,
          attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
          _type: 'direct' as const
        },
        {
          timestamp: 110n, blockNumber: 110n, logIndex: 0,
          attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
          _type: 'delegation' as const
        },
        {
          timestamp: 120n, blockNumber: 120n, logIndex: 0,
          attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
          _type: 'direct' as const
        }
      ];

      const dbFailures = [{
        timestamp: 200n, blockNumber: 200n, logIndex: 0,
        txHash: '0xFail',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      const results = await analyzeStakes(stakes, [], dbFailures);

      // First stake (direct at 100) consumes the event
      expect(results[0].status).toBe('FAILED');
      expect(results[0].failedDepositTxHash).toBe('0xFail');

      // Second and third stakes remain PENDING
      expect(results[1].status).toBe('PENDING');
      expect(results[1].failedDepositTxHash).toBeNull();

      expect(results[2].status).toBe('PENDING');
      expect(results[2].failedDepositTxHash).toBeNull();
    });

    it('should handle duplicate attempt across stake types (Direct succeeds, Delegation fails)', async () => {
      // Direct stake at 100 -> Success at 150
      // Delegation at 200 -> Fail at 250 (duplicate because already active)
      const stakes = [
        {
          timestamp: 100n, blockNumber: 100n, logIndex: 0,
          attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
          _type: 'direct' as const
        },
        {
          timestamp: 200n, blockNumber: 200n, logIndex: 0,
          attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
          _type: 'delegation' as const
        }
      ];

      const dbDeposits = [{
        timestamp: 150n, blockNumber: 150n, logIndex: 0,
        txHash: '0xSuccess',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      const dbFailures = [{
        timestamp: 250n, blockNumber: 250n, logIndex: 0,
        txHash: '0xFail',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      const directResult = results.find(s => s._type === 'direct')!;
      const delegationResult = results.find(s => s._type === 'delegation')!;

      expect(directResult.status).toBe('SUCCESS');
      expect(directResult.depositTxHash).toBe('0xSuccess');

      expect(delegationResult.status).toBe('FAILED');
      expect(delegationResult.failedDepositTxHash).toBe('0xFail');
      expect(delegationResult.failureReason).toBe(FailureReason.DUPLICATE);
    });

    it('should NOT double-consume events when processed separately (bug regression test)', async () => {
      // This test ensures the bug we fixed doesn't come back
      // If we call markStakesWithFailedDeposits twice (once for direct, once for delegation),
      // both would match the same event incorrectly

      const directStake = {
        timestamp: 100n, blockNumber: 100n, logIndex: 0,
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        _type: 'direct' as const
      };

      const delegation = {
        timestamp: 110n, blockNumber: 110n, logIndex: 0,
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        _type: 'delegation' as const
      };

      const dbFailures = [{
        timestamp: 200n, blockNumber: 200n, logIndex: 0,
        txHash: '0xFail',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      // Process together (correct behavior)
      const allStakes = [directStake, delegation];
      const mockDb = createMockDb([], dbFailures);
      const pairs = allStakes.map(s => ({
        attesterAddress: s.attesterAddress,
        withdrawerAddress: s.stakerAddress
      }));
      const eventMap = await fetchFailedDeposits(pairs, mockDb as any);
      const results = markStakesWithFailedDeposits(allStakes, eventMap);

      // Only the first stake should consume the event
      const directResult = results.find(s => s._type === 'direct')!;
      const delegationResult = results.find(s => s._type === 'delegation')!;

      expect(directResult.status).toBe('FAILED');
      expect(directResult.failedDepositTxHash).toBe('0xFail');

      expect(delegationResult.status).toBe('PENDING');
      expect(delegationResult.failedDepositTxHash).toBeNull();

      // This verifies that only ONE event was consumed, not two
      const failedCount = results.filter(r => r.status === 'FAILED').length;
      expect(failedCount).toBe(1);
    });

    it('should preserve correct counts for each stake type after separation', async () => {
      // 3 direct stakes, 2 delegations, mixed success/fail/pending
      const stakes = [
        // Direct stakes
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const },
        { timestamp: 300n, blockNumber: 300n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const },
        // Delegations
        { timestamp: 150n, blockNumber: 150n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'delegation' as const },
        { timestamp: 250n, blockNumber: 250n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'delegation' as const },
      ];

      const dbDeposits = [
        { timestamp: 110n, blockNumber: 110n, logIndex: 0, txHash: '0xS1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }, // Direct1
        { timestamp: 160n, blockNumber: 160n, logIndex: 0, txHash: '0xS2', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }, // Delegation1
      ];
      const dbFailures = [
        { timestamp: 210n, blockNumber: 210n, logIndex: 0, txHash: '0xF1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }, // Direct2
      ];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures);

      // Verify total count
      expect(results.length).toBe(5);

      // Separate by type
      const directResults = results.filter(r => r._type === 'direct');
      const delegationResults = results.filter(r => r._type === 'delegation');

      // Verify counts per type
      expect(directResults.length).toBe(3);
      expect(delegationResults.length).toBe(2);

      // Verify direct stakes statuses
      expect(directResults[0].status).toBe('SUCCESS'); // Consumed Deposit at 110
      expect(directResults[1].status).toBe('FAILED');  // Consumed Failure at 210
      expect(directResults[2].status).toBe('PENDING'); // No event left

      // Verify delegation statuses
      expect(delegationResults[0].status).toBe('SUCCESS'); // Consumed Deposit at 160
      expect(delegationResults[1].status).toBe('PENDING'); // No event left

      // Verify success counts
      const directSuccessCount = directResults.filter(r => r.status === 'SUCCESS').length;
      const delegationSuccessCount = delegationResults.filter(r => r.status === 'SUCCESS').length;
      expect(directSuccessCount).toBe(1);
      expect(delegationSuccessCount).toBe(1);

      // Verify failed counts
      const directFailedCount = directResults.filter(r => r.status === 'FAILED').length;
      const delegationFailedCount = delegationResults.filter(r => r.status === 'FAILED').length;
      expect(directFailedCount).toBe(1);
      expect(delegationFailedCount).toBe(0);

      // Verify pending counts
      const directPendingCount = directResults.filter(r => r.status === 'PENDING').length;
      const delegationPendingCount = delegationResults.filter(r => r.status === 'PENDING').length;
      expect(directPendingCount).toBe(1);
      expect(delegationPendingCount).toBe(1);
    });

    it('should handle empty arrays when filtering by type', async () => {
      // Only direct stakes, no delegations
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const },
      ];

      const dbDeposits = [
        { timestamp: 110n, blockNumber: 110n, logIndex: 0, txHash: '0xS1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
      ];

      const results = await analyzeStakes(stakes, dbDeposits, []);

      const directResults = results.filter(r => r._type === 'direct');
      const delegationResults = results.filter(r => r._type === 'delegation');

      expect(directResults.length).toBe(2);
      expect(delegationResults.length).toBe(0); // No delegations
    });

    it('should maintain order after filtering by type', async () => {
      // Interleaved direct and delegation stakes
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const, id: 'D1' },
        { timestamp: 110n, blockNumber: 110n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'delegation' as const, id: 'DG1' },
        { timestamp: 120n, blockNumber: 120n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const, id: 'D2' },
        { timestamp: 130n, blockNumber: 130n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'delegation' as const, id: 'DG2' },
      ];

      const results = await analyzeStakes(stakes, [], []);

      // Filter by type
      const directResults = results.filter(r => r._type === 'direct');
      const delegationResults = results.filter(r => r._type === 'delegation');

      // Verify order is preserved
      expect(directResults[0].id).toBe('D1');
      expect(directResults[1].id).toBe('D2');
      expect(delegationResults[0].id).toBe('DG1');
      expect(delegationResults[1].id).toBe('DG2');

      // Verify chronological order within each type
      expect(directResults[0].timestamp).toBeLessThan(directResults[1].timestamp);
      expect(delegationResults[0].timestamp).toBeLessThan(delegationResults[1].timestamp);
    });
  });

  describe('Unstake Events', () => {

    it('should mark a stake as UNSTAKED when withdraw event occurs after successful deposit', async () => {
      const stakes = [{
        attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B,
        timestamp: 100n, blockNumber: 100n, logIndex: 0
      }];

      const dbDeposits = [{
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B,
        timestamp: 105n, blockNumber: 105n, logIndex: 1, txHash: '0xSuccess'
      }];

      const dbWithdrawals = [{
        attesterAddress: ATTESTER_A,
        recipientAddress: WITHDRAWER_B,
        stakerAddress: WITHDRAWER_B, // From ATP left join
        timestamp: 200n, blockNumber: 200n, logIndex: 0, txHash: '0xUnstake'
      }];

      const results = await analyzeStakes(stakes, dbDeposits, [], dbWithdrawals);

      expect(results[0].status).toBe('UNSTAKED');
      expect(results[0].unstakeTxHash).toBe('0xUnstake');
    });

    it('should reset active state after unstake allowing new deposits with INVALID_KEY', async () => {
      // Stake1 -> Success -> Unstake -> Stake2 -> Fail (should be INVALID_KEY, not DUPLICATE)
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 300n, blockNumber: 300n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }
      ];

      const dbDeposits = [{
        timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xSuccess',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      const dbWithdrawals = [{
        attesterAddress: ATTESTER_A,
        recipientAddress: WITHDRAWER_B,
        stakerAddress: WITHDRAWER_B,
        timestamp: 200n, blockNumber: 200n, logIndex: 0, txHash: '0xUnstake'
      }];

      const dbFailures = [{
        timestamp: 305n, blockNumber: 305n, logIndex: 0, txHash: '0xFail',
        attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B
      }];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures, dbWithdrawals);

      // Stake1 should be marked as unstaked (takes priority over deposit matching)
      expect(results[0].status).toBe('UNSTAKED');
      expect(results[0].unstakeTxHash).toBe('0xUnstake');

      // Stake2 should fail with INVALID_KEY (active state reset by unstake)
      expect(results[1].status).toBe('FAILED');
      expect(results[1].failureReason).toBe(FailureReason.INVALID_KEY);
      expect(results[1].failedDepositTxHash).toBe('0xFail');
    });

    it('Sequence: Stake -> Success -> Unstake -> Stake -> Success (re-stake after unstake)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 300n, blockNumber: 300n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }
      ];

      const dbDeposits = [
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xSuccess1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        { timestamp: 305n, blockNumber: 305n, logIndex: 0, txHash: '0xSuccess2', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const dbWithdrawals = [{
        attesterAddress: ATTESTER_A,
        recipientAddress: WITHDRAWER_B,
        stakerAddress: WITHDRAWER_B,
        timestamp: 200n, blockNumber: 200n, logIndex: 0, txHash: '0xUnstake'
      }];

      const results = await analyzeStakes(stakes, dbDeposits, [], dbWithdrawals);

      // First stake marked as unstaked
      expect(results[0].status).toBe('UNSTAKED');
      expect(results[0].unstakeTxHash).toBe('0xUnstake');

      // Second stake can succeed (re-stake scenario after unstake)
      expect(results[1].status).toBe('SUCCESS');
      expect(results[1].depositTxHash).toBe('0xSuccess2');
    });

    it('should handle unstake across mixed stake types (direct + delegation)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'direct' as const },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B, _type: 'delegation' as const }
      ];

      const dbDeposits = [
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xSuccess1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        { timestamp: 205n, blockNumber: 205n, logIndex: 0, txHash: '0xSuccess2', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const dbWithdrawals = [
        { attesterAddress: ATTESTER_A, recipientAddress: WITHDRAWER_B, stakerAddress: WITHDRAWER_B, timestamp: 150n, blockNumber: 150n, logIndex: 0, txHash: '0xUnstake1' },
        { attesterAddress: ATTESTER_A, recipientAddress: WITHDRAWER_B, stakerAddress: WITHDRAWER_B, timestamp: 250n, blockNumber: 250n, logIndex: 0, txHash: '0xUnstake2' }
      ];

      const results = await analyzeStakes(stakes, dbDeposits, [], dbWithdrawals);

      // Both stakes should be marked as unstaked
      expect(results[0].status).toBe('UNSTAKED');
      expect(results[0].unstakeTxHash).toBe('0xUnstake1');
      expect(results[0]._type).toBe('direct');

      expect(results[1].status).toBe('UNSTAKED');
      expect(results[1].unstakeTxHash).toBe('0xUnstake2');
      expect(results[1]._type).toBe('delegation');
    });

    it('Sequence: Stake1 -> Success -> Stake2 -> Success -> Unstake (only first stake unstaked)', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }
      ];

      const dbDeposits = [
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xSuccess1', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B },
        { timestamp: 205n, blockNumber: 205n, logIndex: 0, txHash: '0xSuccess2', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const dbWithdrawals = [{
        attesterAddress: ATTESTER_A,
        recipientAddress: WITHDRAWER_B,
        stakerAddress: WITHDRAWER_B,
        timestamp: 150n, blockNumber: 150n, logIndex: 0, txHash: '0xUnstake'
      }];

      const results = await analyzeStakes(stakes, dbDeposits, [], dbWithdrawals);

      // First stake unstaked
      expect(results[0].status).toBe('UNSTAKED');
      expect(results[0].unstakeTxHash).toBe('0xUnstake');

      // Second stake still success (unstake happened before this stake)
      expect(results[1].status).toBe('SUCCESS');
      expect(results[1].depositTxHash).toBe('0xSuccess2');
    });

    it('Failed stakes should remain FAILED even if unstake event exists', async () => {
      const stakes = [
        { timestamp: 100n, blockNumber: 100n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B },
        { timestamp: 200n, blockNumber: 200n, logIndex: 0, attesterAddress: ATTESTER_A, stakerAddress: WITHDRAWER_B }
      ];

      const dbFailures = [
        { timestamp: 105n, blockNumber: 105n, logIndex: 0, txHash: '0xFail', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const dbDeposits = [
        { timestamp: 205n, blockNumber: 205n, logIndex: 0, txHash: '0xSuccess', attesterAddress: ATTESTER_A, withdrawerAddress: WITHDRAWER_B }
      ];

      const dbWithdrawals = [{
        attesterAddress: ATTESTER_A,
        recipientAddress: WITHDRAWER_B,
        stakerAddress: WITHDRAWER_B,
        timestamp: 250n, blockNumber: 250n, logIndex: 0, txHash: '0xUnstake'
      }];

      const results = await analyzeStakes(stakes, dbDeposits, dbFailures, dbWithdrawals);

      // First stake should remain FAILED (not UNSTAKED)
      expect(results[0].status).toBe('FAILED');
      expect(results[0].failedDepositTxHash).toBe('0xFail');
      expect(results[0].unstakeTxHash).toBeNull();

      // Second stake should be UNSTAKED (successful then unstaked)
      expect(results[1].status).toBe('UNSTAKED');
      expect(results[1].unstakeTxHash).toBe('0xUnstake');
    });
  });
});
