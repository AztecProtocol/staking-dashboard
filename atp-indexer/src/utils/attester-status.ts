import type { Address, PublicClient } from 'viem';
import { GSE_ABI, ROLLUP_ABI } from '../abis';

/**
 * On-chain attester status, read per rollup. The summary endpoint uses this
 * instead of deriving statuses from deposit/withdraw event counts: those
 * counts mix rollups, cannot see attesters that followed the latest rollup
 * through the GSE bonus instance, and turn any indexing gap into phantom
 * exiting or zombie attesters.
 */

/** `Status` enum from the rollup's StakingLib. */
export enum AttesterStatus {
  NONE = 0,
  VALIDATING = 1,
  ZOMBIE = 2,
  EXITING = 3,
}

export interface RollupStakeTotals {
  rollup: Address;
  validating: number;
  exiting: number;
  zombie: number;
  /** GSE effective balance of the VALIDATING attesters. */
  validatingStake: bigint;
  /** Exit amounts of the EXITING attesters. */
  exitingStake: bigint;
  /** Exit amounts of the ZOMBIE attesters. */
  zombieStake: bigint;
}

/** Calls per multicall. Each call is a few storage reads, well inside an eth_call's gas. */
const MULTICALL_CHUNK = 1000;

async function multicallChunked<T>(
  client: PublicClient,
  contracts: readonly unknown[],
): Promise<T[]> {
  const out: T[] = [];
  // Sequential on purpose: a few dozen parallel eth_calls trips RPC rate limits.
  for (let i = 0; i < contracts.length; i += MULTICALL_CHUNK) {
    const chunk = contracts.slice(i, i + MULTICALL_CHUNK);
    const results = await client.multicall({
      contracts: chunk as any,
      allowFailure: false,
      batchSize: 0,
    });
    out.push(...(results as T[]));
  }
  return out;
}

/**
 * Reads the status and stake of each attester on each rollup.
 *
 * Every rollup version shares one GSE, so the GSE is read once from the first
 * rollup. A VALIDATING attester's stake sits in the GSE; once an attester
 * starts exiting or is slashed below the ejection threshold the stake moves
 * into the rollup's exit record, so it is read from `getExit`.
 */
export async function readRollupStakeTotals(
  client: PublicClient,
  rollups: readonly Address[],
  attesters: readonly Address[],
): Promise<RollupStakeTotals[]> {
  if (rollups.length === 0) return [];

  const gse = (await client.readContract({
    address: rollups[0],
    abi: ROLLUP_ABI,
    functionName: 'getGSE',
  })) as Address;

  const totals: RollupStakeTotals[] = [];
  for (const rollup of rollups) {
    const statuses = await multicallChunked<number>(
      client,
      attesters.map((attester) => ({
        address: rollup,
        abi: ROLLUP_ABI,
        functionName: 'getStatus',
        args: [attester],
      })),
    );

    const validating: Address[] = [];
    const exitingOrZombie: { attester: Address; status: AttesterStatus }[] = [];
    statuses.forEach((status, i) => {
      if (status === AttesterStatus.VALIDATING) validating.push(attesters[i]);
      else if (status === AttesterStatus.EXITING || status === AttesterStatus.ZOMBIE) {
        exitingOrZombie.push({ attester: attesters[i], status });
      }
    });

    const balances = await multicallChunked<bigint>(
      client,
      validating.map((attester) => ({
        address: gse,
        abi: GSE_ABI,
        functionName: 'effectiveBalanceOf',
        args: [rollup, attester],
      })),
    );
    const exits = await multicallChunked<{ amount: bigint }>(
      client,
      exitingOrZombie.map(({ attester }) => ({
        address: rollup,
        abi: ROLLUP_ABI,
        functionName: 'getExit',
        args: [attester],
      })),
    );

    const row: RollupStakeTotals = {
      rollup,
      validating: validating.length,
      exiting: 0,
      zombie: 0,
      validatingStake: balances.reduce((sum, b) => sum + b, 0n),
      exitingStake: 0n,
      zombieStake: 0n,
    };
    exitingOrZombie.forEach(({ status }, i) => {
      if (status === AttesterStatus.EXITING) {
        row.exiting++;
        row.exitingStake += exits[i].amount;
      } else {
        row.zombie++;
        row.zombieStake += exits[i].amount;
      }
    });
    totals.push(row);
  }
  return totals;
}

const SNAPSHOT_TTL_MS = 60 * 1000;
let snapshot: { key: string; at: number; totals: RollupStakeTotals[] } | null = null;
let inFlight: { key: string; promise: Promise<RollupStakeTotals[]> } | null = null;

function refresh(
  client: PublicClient,
  key: string,
  rollups: readonly Address[],
  attesters: readonly Address[],
): Promise<RollupStakeTotals[]> {
  if (inFlight && inFlight.key === key) return inFlight.promise;
  const promise = readRollupStakeTotals(client, rollups, attesters)
    .then((totals) => {
      snapshot = { key, at: Date.now(), totals };
      return totals;
    })
    .finally(() => {
      inFlight = null;
    });
  inFlight = { key, promise };
  return promise;
}

/**
 * {@link readRollupStakeTotals} behind a 60s cache. A full read takes several
 * seconds on mainnet, so once a snapshot exists a stale one is returned at
 * once while a single background read refreshes it; a failed refresh keeps
 * the previous snapshot. Only the first request after startup, or after the
 * rollup set changes, waits for the read.
 */
export async function getRollupStakeTotals(
  client: PublicClient,
  rollups: readonly Address[],
  attesters: readonly Address[],
): Promise<RollupStakeTotals[]> {
  const key = rollups.join(',');
  if (snapshot && snapshot.key === key) {
    if (Date.now() - snapshot.at >= SNAPSHOT_TTL_MS) {
      refresh(client, key, rollups, attesters).catch((error) => {
        console.error('Attester status refresh failed, serving the previous snapshot:', error);
      });
    }
    return snapshot.totals;
  }
  return refresh(client, key, rollups, attesters);
}

/** Test hook: drops the cached snapshot. */
export function resetRollupStakeTotalsCache(): void {
  snapshot = null;
  inFlight = null;
}
