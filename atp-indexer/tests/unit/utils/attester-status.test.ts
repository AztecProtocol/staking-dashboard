import {
  AttesterStatus,
  getRollupStakeTotals,
  readRollupStakeTotals,
  resetRollupStakeTotalsCache,
} from '../../../src/utils/attester-status';
import type { Address, PublicClient } from 'viem';

const GSE = '0x00000000000000000000000000000000000000ee' as Address;
const CANONICAL = '0x00000000000000000000000000000000000000c0' as Address;
const LEGACY = '0x00000000000000000000000000000000000000b0' as Address;
const A = '0x000000000000000000000000000000000000000a' as Address;
const B = '0x000000000000000000000000000000000000000b' as Address;
const C = '0x000000000000000000000000000000000000000c' as Address;
const D = '0x000000000000000000000000000000000000000d' as Address;

const STAKE = 200_000n * 10n ** 18n;

/**
 * Fake chain: status, GSE balance and exit amount per (rollup, attester).
 * The client answers multicalls by looking each call up here.
 */
function fakeClient(chain: Record<string, Record<string, { status: AttesterStatus; balance?: bigint; exit?: bigint }>>) {
  const multicall = jest.fn(async ({ contracts }: { contracts: any[] }) =>
    contracts.map((c) => {
      switch (c.functionName) {
        case 'getStatus':
          return chain[c.address]?.[c.args[0]]?.status ?? AttesterStatus.NONE;
        case 'effectiveBalanceOf':
          expect(c.address).toBe(GSE);
          return chain[c.args[0]]?.[c.args[1]]?.balance ?? 0n;
        case 'getExit':
          return { amount: chain[c.address]?.[c.args[0]]?.exit ?? 0n };
        default:
          throw new Error(`unexpected call ${c.functionName}`);
      }
    }),
  );
  const readContract = jest.fn(async () => GSE);
  return { client: { multicall, readContract } as unknown as PublicClient, multicall, readContract };
}

describe('readRollupStakeTotals', () => {
  it('counts each status per rollup and reads stake from the GSE or the exit record', async () => {
    const { client } = fakeClient({
      [CANONICAL]: {
        [A]: { status: AttesterStatus.VALIDATING, balance: STAKE },
        [B]: { status: AttesterStatus.VALIDATING, balance: STAKE - 6_000n },
        [C]: { status: AttesterStatus.EXITING, exit: STAKE },
      },
      [LEGACY]: {
        [C]: { status: AttesterStatus.NONE },
        [D]: { status: AttesterStatus.ZOMBIE, exit: 94_000n },
        [A]: { status: AttesterStatus.VALIDATING, balance: STAKE },
      },
    });

    const totals = await readRollupStakeTotals(client, [LEGACY, CANONICAL], [A, B, C, D]);

    expect(totals).toEqual([
      { rollup: LEGACY, validating: 1, exiting: 0, zombie: 1, validatingStake: STAKE, exitingStake: 0n, zombieStake: 94_000n },
      {
        rollup: CANONICAL,
        validating: 2,
        exiting: 1,
        zombie: 0,
        validatingStake: 2n * STAKE - 6_000n,
        exitingStake: STAKE,
        zombieStake: 0n,
      },
    ]);
  });

  it('splits large attester sets across several multicalls', async () => {
    const attesters = Array.from({ length: 2500 }, (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}` as Address);
    const { client, multicall } = fakeClient({});

    const totals = await readRollupStakeTotals(client, [CANONICAL], attesters);

    expect(totals[0].validating).toBe(0);
    const statusCalls = multicall.mock.calls.filter(([arg]) => arg.contracts[0]?.functionName === 'getStatus');
    expect(statusCalls.map(([arg]) => arg.contracts.length)).toEqual([1000, 1000, 500]);
  });

  it('returns nothing when there are no rollups', async () => {
    const { client, readContract } = fakeClient({});
    expect(await readRollupStakeTotals(client, [], [A])).toEqual([]);
    expect(readContract).not.toHaveBeenCalled();
  });
});

describe('getRollupStakeTotals', () => {
  beforeEach(() => resetRollupStakeTotalsCache());

  it('reuses the snapshot within the TTL', async () => {
    const { client, multicall } = fakeClient({ [CANONICAL]: { [A]: { status: AttesterStatus.VALIDATING, balance: STAKE } } });

    await getRollupStakeTotals(client, [CANONICAL], [A]);
    const callsAfterFirst = multicall.mock.calls.length;
    await getRollupStakeTotals(client, [CANONICAL], [A]);

    expect(multicall.mock.calls.length).toBe(callsAfterFirst);
  });

  it('serves the stale snapshot while refreshing in the background', async () => {
    const chain = { [CANONICAL]: { [A]: { status: AttesterStatus.VALIDATING, balance: STAKE } } };
    const { client } = fakeClient(chain);
    const first = await getRollupStakeTotals(client, [CANONICAL], [A]);

    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 120_000);
    chain[CANONICAL][A] = { status: AttesterStatus.EXITING, exit: STAKE } as any;
    const stale = await getRollupStakeTotals(client, [CANONICAL], [A]);
    expect(stale).toBe(first);

    // Let the background read settle, then the next call sees it.
    await new Promise((resolve) => setImmediate(resolve));
    const fresh = await getRollupStakeTotals(client, [CANONICAL], [A]);
    expect(fresh[0].exiting).toBe(1);
    clock.mockRestore();
  });

  it('keeps the previous snapshot when a background refresh fails', async () => {
    const { client, multicall } = fakeClient({ [CANONICAL]: { [A]: { status: AttesterStatus.VALIDATING, balance: STAKE } } });
    const first = await getRollupStakeTotals(client, [CANONICAL], [A]);

    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);
    multicall.mockRejectedValueOnce(new Error('rpc down'));
    expect(await getRollupStakeTotals(client, [CANONICAL], [A])).toBe(first);
    await new Promise((resolve) => setImmediate(resolve));

    expect(errors).toHaveBeenCalled();
    expect(await getRollupStakeTotals(client, [CANONICAL], [A])).toBe(first);
    clock.mockRestore();
    errors.mockRestore();
  });

  it('throws when the first read fails', async () => {
    const { client, multicall } = fakeClient({});
    multicall.mockRejectedValueOnce(new Error('rpc down'));

    await expect(getRollupStakeTotals(client, [CANONICAL], [A])).rejects.toThrow('rpc down');
  });
});
