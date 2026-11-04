import type { Context } from 'hono';
import { db } from 'ponder:api';
import { asc, count } from 'drizzle-orm';
import type { Address } from 'viem';
import { getActivationThreshold, calculateAPR, getActiveAttesterCount } from '../../../utils/rollup';
import { getCanonicalRollupAddress } from '../../utils/canonical-rollup';
import { getPublicClient } from '../../../utils/viem-client';
import { getRollupStakeTotals } from '../../../utils/attester-status';
import { checksumAddress, normalizeAddress } from '../../../utils/address';
import type { StakingSummaryResponse } from '../../types/staking.types';
import {
  stakedWithProvider,
  erc20StakedWithProvider,
  staked,
  failedDeposit,
  provider,
  atpPosition,
  deposit,
  rollupVersion
} from 'ponder:schema';

/**
 * Handle GET /api/staking/summary
 * Get overall staking network statistics
 */
export async function handleStakingSummary(c: Context): Promise<Response> {
  try {
    const client = getPublicClient();
    const rollupAddress = await getCanonicalRollupAddress(client);

    // Data model explanation:
    // - `deposit` table: ALL Rollup:Deposit events (validator registrations on-chain)
    //   This includes BOTH provider delegations AND direct deposits, for both ATP and ERC20 flows.
    // - `stakedWithProvider`: ATP-based provider delegations (tracks source of stake)
    // - `erc20StakedWithProvider`: ERC20-based provider delegations (tracks source of stake)
    // - `staked`: ATP-based direct stakes (tracks source of stake)
    // - ERC20-based direct deposits: Only in `deposit` table (no separate tracking table yet)
    //
    // These tables categorize where stake came from (ATP vs ERC20, direct vs
    // provider). Attester statuses and stake amounts are read from chain below.
    const [
      activationThreshold,
      delegationsCountResult,       // ATP provider delegations
      erc20DelegationsCountResult,  // ERC20 provider delegations
      directStakesCountResult,      // ATP direct stakes
      failedDepositsLengthResult,
      uniqueProvidersCountResult,
      totalATPsResult,
      totalDepositsCountResult,     // ALL deposits, used to derive ERC20 direct deposits
      currentAPR,
      rollupRows,
      depositedAttesterRows,
      // Authoritative active count from chain. `getActiveAttesterCount`
      // returns the VALIDATING set on the canonical rollup.
      activeAttesterCount
    ] = await Promise.all([
      getActivationThreshold(rollupAddress, client),
      db.select({ count: count() }).from(stakedWithProvider),
      db.select({ count: count() }).from(erc20StakedWithProvider),
      db.select({ count: count() }).from(staked),
      db.select({ count: count() }).from(failedDeposit),
      db.select({ count: count() }).from(provider),
      db.select({ count: count() }).from(atpPosition),
      db.select({ count: count() }).from(deposit),
      calculateAPR(rollupAddress, client),
      db.select({ address: rollupVersion.address }).from(rollupVersion).orderBy(asc(rollupVersion.blockNumber)),
      db.selectDistinct({ attesterAddress: deposit.attesterAddress }).from(deposit),
      getActiveAttesterCount(rollupAddress, client)
    ]);

    const atpDelegationsCount = Number(delegationsCountResult[0].count);
    const erc20DelegationsCount = Number(erc20DelegationsCountResult[0].count);
    const directStakesCount = Number(directStakesCountResult[0].count);  // ATP direct stakes only
    const failedDepositsLength = Number(failedDepositsLengthResult[0].count);
    const uniqueProvidersCount = Number(uniqueProvidersCountResult[0].count);
    const totalATPs = Number(totalATPsResult[0].count);
    const totalDepositsCount = Number(totalDepositsCountResult[0].count);

    // Total delegations includes both ATP-based and ERC20-based
    const totalDelegationsCount = atpDelegationsCount + erc20DelegationsCount;

    // Calculate ERC20 direct deposits (not tracked separately, derived from deposit table)
    // ERC20 direct deposits = Total deposits - ATP delegations - ERC20 delegations - ATP direct stakes
    // Note: This only counts activated validators, not those still in queue
    // Note: Failed deposits are tracked in stakedWithProvider/staked tables but NOT in deposit table,
    // so we add failedDepositsLength to balance the equation
    const erc20DirectDepositsRaw = totalDepositsCount + failedDepositsLength - atpDelegationsCount - erc20DelegationsCount - directStakesCount;

    // Guard against negative values during re-indexing or data inconsistencies
    if (erc20DirectDepositsRaw < 0) {
      console.error('ERC20 direct deposits calculation is negative - data inconsistency detected', {
        result: erc20DirectDepositsRaw,
        timestamp: new Date().toISOString(),
        breakdown: {
          totalDepositsCount,
          failedDepositsLength,
          atpDelegationsCount,
          erc20DelegationsCount,
          directStakesCount,
        },
        calculation: `${totalDepositsCount} + ${failedDepositsLength} - ${atpDelegationsCount} - ${erc20DelegationsCount} - ${directStakesCount} = ${erc20DirectDepositsRaw}`,
        note: 'ERC20 direct stakes are derived by subtraction. Negative value indicates event handler inconsistencies or re-indexing issues.'
      });
    }
    const erc20DirectDepositsCount = Math.max(0, erc20DirectDepositsRaw);

    // Statuses and stake come from chain, per rollup: `getStatus` for every
    // attester that ever deposited, on every rollup the registry has
    // announced. Counting deposit and withdraw events instead mixes rollups
    // and turns any indexing gap into phantom exiting or zombie attesters.
    const canonical = normalizeAddress(rollupAddress) as Address;
    const rollups = rollupRows.length > 0
      ? rollupRows.map(r => normalizeAddress(r.address) as Address)
      : [canonical];
    const attesters = depositedAttesterRows.map(r => r.attesterAddress as Address);
    const perRollup = await getRollupStakeTotals(client, rollups, attesters);

    let exitingCount = 0;
    let zombieCount = 0;
    let legacyActiveCount = 0;
    let totalValueLocked = 0n;
    let activeValueLocked = 0n;
    let canonicalValidating = 0;
    for (const r of perRollup) {
      exitingCount += r.exiting;
      zombieCount += r.zombie;
      totalValueLocked += r.validatingStake + r.exitingStake + r.zombieStake;
      if (r.rollup === canonical) {
        canonicalValidating = r.validating;
        activeValueLocked = r.validatingStake;
      } else {
        legacyActiveCount += r.validating;
      }
    }

    const activeCount = Number(activeAttesterCount);
    if (activeCount !== canonicalValidating) {
      // Every VALIDATING attester emitted a Deposit, so a gap means the
      // indexer is missing deposits (or is still syncing).
      console.warn('Canonical VALIDATING count from getStatus differs from getActiveAttesterCount', {
        fromStatus: canonicalValidating,
        fromChain: activeCount,
      });
    }
    const totalStakes = activeCount + legacyActiveCount + exitingCount + zombieCount;

    const response: StakingSummaryResponse = {
      totalValueLocked: totalValueLocked.toString(),
      totalStakers: totalStakes,
      currentAPR: currentAPR,
      // Active-only TVL — the primary display number on the dashboard.
      // The UI shows the rest (exiting, zombie, still on an older
      // rollup) as a smaller subline.
      activeValueLocked: activeValueLocked.toString(),
      stats: {
        totalStakes: totalStakes,
        activeStakes: activeCount,
        legacyActiveStakes: legacyActiveCount,
        exitingStakes: exitingCount,
        zombieStakes: zombieCount,
        delegatedStakes: totalDelegationsCount,
        atpDelegatedStakes: atpDelegationsCount,
        erc20DelegatedStakes: erc20DelegationsCount,
        directStakes: directStakesCount,
        erc20DirectStakes: erc20DirectDepositsCount,  // ERC20 direct deposits (own validator registrations)
        failedDeposits: failedDepositsLength,
        activeProviders: uniqueProvidersCount,
        totalATPs: totalATPs,
        activationThreshold: activationThreshold
      },
      rollups: perRollup.map(r => ({
        rollup: checksumAddress(r.rollup),
        canonical: r.rollup === canonical,
        validating: r.validating,
        exiting: r.exiting,
        zombie: r.zombie,
        valueLocked: (r.validatingStake + r.exitingStake + r.zombieStake).toString(),
      }))
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching staking summary:', error);
    return c.json({ error: 'Failed to fetch staking summary' }, 500);
  }
}
