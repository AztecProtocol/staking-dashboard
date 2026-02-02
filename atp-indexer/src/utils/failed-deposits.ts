/**
 *
 * PURPOSE:
 * This utility analyzes the relationship between Stake transactions and their corresponding
 * Deposit/FailedDeposit events to determine the status and failure reason of each stake.
 *
 * PROBLEM:
 * When users stake and sequencer enter queue, rollup then would flush the queue that triggers either:
 * - A Deposit event (successful sequencer registration)
 * - A FailedDeposit event (rejected sequencer)
 *
 * However, the smart contract doesn't explicitly tell us WHY a deposit failed and which Stakes a FailedDeposit event belong to.
 * We need to infer that by analyzing the chronological history of events.
 *
 * SOLUTION:
 * 1. Build a timeline of ALL events (Deposit + FailedDeposit) per attester-withdrawer pair
 * 2. Track "active state" - whether a pair has successfully deposited before
 * 3. Infer failure reason based on state:
 *    - INVALID_KEY: Failed before any successful deposit (bad validator key)
 *    - DUPLICATE: Failed after a successful deposit (key already registered)
 * 4. Match events to stakes using FIFO (First-In-First-Out) chronological order
 *
 * KEY CONCEPTS:
 * - Timeline: Events sorted by blockNumber then logIndex for deterministic ordering
 * - Active State: Tracks if an attester-withdrawer pair has ever succeeded
 * - FIFO Matching: Each stake consumes the first eligible event after it
 * - Event Consumption: Once matched, an event (FailedDeposit / Deposit) cannot be reused for another stake
 *
 * EXAMPLE FLOW:
 * Stake(100) -> FailedDeposit(105) -> Stake(200) -> Deposit(205)
 * Result:
 * - Stake(100): FAILED with INVALID_KEY reason (no prior success)
 * - Stake(200): SUCCESS (matched with Deposit at 205)
 *
 * FUTURE: When unstaking is implemented, reset active state on unstake events.
 */

import { deposit, failedDeposit, withdrawFinalized, atpPosition, withdrawInitiated } from 'ponder:schema';
import { normalizeAddress } from './address';
import { and, eq, or, ReadonlyDrizzle } from 'ponder';

export enum FailureReason {
  INVALID_KEY = 'Likely a Invalid Key',
  DUPLICATE = 'Likely a Duplicate Attempt'
}

export interface FailedDepositEntry {
  type: 'SUCCESS' | 'FAILURE' | 'UNSTAKE';
  timestamp: bigint;
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
  reason?: FailureReason;
}

export interface AttesterWithdrawerPair {
  attesterAddress: string;
  withdrawerAddress: string;
}

/**
 * Fetch failed deposits and INFER the reason based on Deposit history
 * Adapted for Ponder's DB API
 */
export async function fetchFailedDeposits(
  pairs: AttesterWithdrawerPair[],
  db: ReadonlyDrizzle<typeof import('../../ponder.schema')>
): Promise<Map<string, FailedDepositEntry[]>> {

  // DEDUPLICATE INPUT
  // Caller sends [{A, B}, {A, B}].
  // Convert to unique map to prevent redundant SQL OR clauses.
  const uniquePairs = new Map<string, AttesterWithdrawerPair>();
  for (const p of pairs) {
    // Normalize to ensure 0xABC and 0xabc are treated as the same
    const key = `${normalizeAddress(p.attesterAddress)}-${normalizeAddress(p.withdrawerAddress)}`;
    uniquePairs.set(key, p);
  }
  const distinctPairs = Array.from(uniquePairs.values());

  const buildPairFilter = (table: any, pairs: any[]) => {
    return or(
      ...pairs.map((pair) =>
        and(
          eq(table.attesterAddress, normalizeAddress(pair.attesterAddress)),
          eq(table.withdrawerAddress, normalizeAddress(pair.withdrawerAddress))
        )
      )
    );
  }

  // Fetch withdraw events and join with ATP to get staker/withdrawer address
  const withdrawEvents = await db.select({
    attesterAddress: withdrawFinalized.attesterAddress,
    recipientAddress: withdrawFinalized.recipientAddress,
    timestamp: withdrawFinalized.timestamp,
    blockNumber: withdrawFinalized.blockNumber,
    logIndex: withdrawFinalized.logIndex,
    txHash: withdrawFinalized.txHash,
    stakerAddress: atpPosition.stakerAddress,
  })
    .from(withdrawFinalized)
    .leftJoin(atpPosition, eq(withdrawFinalized.recipientAddress, atpPosition.address))
    .where(
      or(
        // ATP-based: match via ATP position (staker contract)
        ...distinctPairs.map((pair) =>
          and(
            eq(withdrawFinalized.attesterAddress, normalizeAddress(pair.attesterAddress) as `0x${string}`),
            eq(atpPosition.stakerAddress, normalizeAddress(pair.withdrawerAddress) as `0x${string}`)
          )
        ),
        // ERC20-based: match directly via recipient address (user's EOA wallet)
        ...distinctPairs.map((pair) =>
          and(
            eq(withdrawFinalized.attesterAddress, normalizeAddress(pair.attesterAddress) as `0x${string}`),
            eq(withdrawFinalized.recipientAddress, normalizeAddress(pair.withdrawerAddress) as `0x${string}`)
          )
        )
      )
    );

  const [successfulDeposits, failedDeposits] = await Promise.all([
    db.select()
      .from(deposit)
      .where(buildPairFilter(deposit, distinctPairs)),
    db.select()
      .from(failedDeposit)
      .where(buildPairFilter(failedDeposit, distinctPairs))
  ]);

  // Combine and Sort to create the "God View" timeline
  // We need strictly chronological order: Block ASC -> LogIndex ASC
  const timeline = [
    ...successfulDeposits.map((d: any) => ({ ...d, type: 'SUCCESS' as const, withdrawerAddress: d.withdrawerAddress })),
    ...failedDeposits.map((f: any) => ({ ...f, type: 'FAIL' as const, withdrawerAddress: f.withdrawerAddress })),
    ...withdrawEvents.map((w: any) => ({ ...w, type: 'UNSTAKE' as const, withdrawerAddress: w.stakerAddress || w.recipientAddress, attesterAddress: w.attesterAddress }))
  ].sort((a, b) => {
    const blockDiff = Number(a.blockNumber - b.blockNumber);
    if (blockDiff !== 0) return blockDiff;
    return a.logIndex - b.logIndex;
  });

  const eventMap = new Map<string, FailedDepositEntry[]>();

  // To deduce failed deposit reason, if the previous event is deposit (active stake), then the current event is very likely to be duplicate attempt
  // In the future if unstake is allowed, the logic should be updated
  // Reset active state if unstake event with the same pair is found
  // e.g : Deposit (active = true) -> Unstake (active = false) -> Deposit (active = true)
  const activeState = new Map<string, boolean>();

  // Make sure similar attester-withdrawer event is not deduplicated by using txhash-logindex
  // Because each event event will be consumed by stakes
  const seenEvents = new Map<string, Set<string>>();

  for (const event of timeline) {
    const key = `${event.attesterAddress.toLowerCase()}-${event.withdrawerAddress.toLowerCase()}`;
    const uniqueId = `${event.txHash}-${event.logIndex}`;
    const isActive = activeState.get(key) || false;

    if (!seenEvents.has(key)) seenEvents.set(key, new Set());

    // Deduplicate specific events (in case similar blockNumber & logIndex, which is very very unlikely to happen)
    if (seenEvents.get(key)!.has(uniqueId)) continue;
    seenEvents.get(key)!.add(uniqueId);

    if (!eventMap.has(key)) eventMap.set(key, []);

    // Determine the event type and track active state
    if (event.type === 'SUCCESS') {
      activeState.set(key, true);
      eventMap.get(key)!.push({
        type: 'SUCCESS',
        timestamp: event.timestamp,
        txHash: event.txHash,
        logIndex: event.logIndex,
        blockNumber: event.blockNumber
      });
    }
    else if (event.type === 'UNSTAKE') {
      // Reset active state when unstake occurs
      activeState.set(key, false);
      // Add unstake event to be consumed by stakes
      eventMap.get(key)!.push({
        type: 'UNSTAKE',
        timestamp: event.timestamp,
        txHash: event.txHash,
        logIndex: event.logIndex,
        blockNumber: event.blockNumber
      });
    }
    else {
      const reason = isActive ? FailureReason.DUPLICATE : FailureReason.INVALID_KEY;

      eventMap.get(key)!.push({
        type: 'FAILURE',
        timestamp: event.timestamp,
        txHash: event.txHash,
        logIndex: event.logIndex,
        blockNumber: event.blockNumber,
        reason: reason
      });
    }
  }

  return eventMap;
}

export interface StakeWithFailedDeposit {
  hasFailedDeposit: boolean;
  failedDepositTxHash: string | null;
  depositTxHash: string | null;
  unstakeTxHash: string | null;
  failureReason: FailureReason | null;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNSTAKED'
}

/**
 * Mark stakes with failed deposits and attach the inferred reason
 */
export function markStakesWithFailedDeposits<T extends { timestamp: bigint; blockNumber: bigint; logIndex: number; attesterAddress: string; stakerAddress: string }>(
  stakes: T[],
  eventsMap: Map<string, FailedDepositEntry[]>
): Array<T & StakeWithFailedDeposit> {

  const sortedStakes = [...stakes].sort((a, b) => {
    const blockDiff = Number(a.blockNumber - b.blockNumber);
    if (blockDiff !== 0) return blockDiff;
    return a.logIndex - b.logIndex;
  });

  const consumedEvents = new Set<string>();
  const markedStakes: Array<T & StakeWithFailedDeposit> = [];

  for (const stake of sortedStakes) {
    const attesterKey = normalizeAddress(stake.attesterAddress)
    const withdrawerKey = normalizeAddress(stake.stakerAddress)
    const mapKey = `${attesterKey}-${withdrawerKey}`;
    const events = eventsMap.get(mapKey);

    let hasFailedDeposit = false;
    let status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNSTAKED' = 'PENDING'
    let failedDepositTxHash: string | null = null;
    let depositTxHash: string | null = null
    let unstakeTxHash: string | null = null;
    let failureReason: FailureReason | null = null;

    if (events) {
      // First check for deposit/failed deposit events
      const matchingEvent = events.find(fd => {
        const key = `${mapKey}-${fd.blockNumber}-${fd.logIndex}`;
        return !consumedEvents.has(key) && fd.timestamp >= stake.timestamp && fd.type !== 'UNSTAKE';
      });

      if (matchingEvent) {
        // Mark event as consumed
        consumedEvents.add(`${mapKey}-${matchingEvent.blockNumber}-${matchingEvent.logIndex}`);

        if (matchingEvent.type === 'SUCCESS') {
          depositTxHash = matchingEvent.txHash
          hasFailedDeposit = false;
          status = 'SUCCESS'

          // Check if there's an unstake event after this successful deposit
          // Must be after the deposit event (not just after the stake) and not already consumed
          const unstakeEvent = events.find(fd => {
            const eventKey = `${mapKey}-${fd.blockNumber}-${fd.logIndex}`;
            return fd.type === 'UNSTAKE' &&
              !consumedEvents.has(eventKey) &&
              fd.timestamp >= matchingEvent.timestamp;
          });

          if (unstakeEvent) {
            // Mark unstake event as consumed so it's not matched to other stakes
            consumedEvents.add(`${mapKey}-${unstakeEvent.blockNumber}-${unstakeEvent.logIndex}`);
            unstakeTxHash = unstakeEvent.txHash;
            status = 'UNSTAKED';
          }
        } else {
          hasFailedDeposit = true;
          failedDepositTxHash = matchingEvent.txHash;
          failureReason = matchingEvent.reason || null;
          depositTxHash = null
          status = 'FAILED'
        }
      }
    }

    markedStakes.push({
      ...stake,
      hasFailedDeposit,
      failedDepositTxHash,
      depositTxHash,
      unstakeTxHash,
      failureReason,
      status
    });
  }

  return markedStakes;
}

export function filterValidStakes<T extends { timestamp: bigint; blockNumber: bigint; logIndex: number; attesterAddress: string; stakerAddress: string }>(
  stakes: T[],
  failedDepositMap: Map<string, FailedDepositEntry[]>
): T[] {
  const markedStakes = markStakesWithFailedDeposits(stakes, failedDepositMap);
  return markedStakes
    .filter(stake => !stake.hasFailedDeposit && stake.status !== 'UNSTAKED')
    .map(({ hasFailedDeposit, failedDepositTxHash, failureReason, depositTxHash, unstakeTxHash, status, ...stake }) => stake as unknown as T);
}
