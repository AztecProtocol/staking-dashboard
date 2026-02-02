import type { Context } from 'hono';
import { db } from 'ponder:api';
import { count } from 'drizzle-orm';
import { getActivationThreshold, calculateAPR } from '../../../utils/rollup';
import { config } from '../../../config';
import { getPublicClient } from '../../../utils/viem-client';
import type { StakingSummaryResponse } from '../../types/staking.types';
import {
  stakedWithProvider,
  erc20StakedWithProvider,
  staked,
  failedDeposit,
  provider,
  atpPosition,
  withdrawFinalized,
  deposit
} from 'ponder:schema';

/**
 * Handle GET /api/staking/summary
 * Get overall staking network statistics
 */
export async function handleStakingSummary(c: Context): Promise<Response> {
  try {
    const client = getPublicClient();
    const rollupAddress = config.ROLLUP_ADDRESS;

    // Data model explanation:
    // - `deposit` table: ALL Rollup:Deposit events (validator registrations on-chain)
    //   This includes BOTH provider delegations AND direct deposits, for both ATP and ERC20 flows.
    // - `stakedWithProvider`: ATP-based provider delegations (tracks source of stake)
    // - `erc20StakedWithProvider`: ERC20-based provider delegations (tracks source of stake)
    // - `staked`: ATP-based direct stakes (tracks source of stake)
    // - ERC20-based direct deposits: Only in `deposit` table (no separate tracking table yet)
    //
    // The `deposit` table is the source of truth for total validator registrations,
    // while other tables help categorize the source (ATP vs ERC20, direct vs provider).
    const [
      activationThreshold,
      delegationsCountResult,       // ATP provider delegations
      erc20DelegationsCountResult,  // ERC20 provider delegations
      directStakesCountResult,      // ATP direct stakes
      failedDepositsLengthResult,
      withdrawnCountResult,
      uniqueProvidersCountResult,
      totalATPsResult,
      totalDepositsCountResult,     // ALL deposits (source of truth for total stakes)
      currentAPR
    ] = await Promise.all([
      getActivationThreshold(rollupAddress, client),
      db.select({ count: count() }).from(stakedWithProvider),
      db.select({ count: count() }).from(erc20StakedWithProvider),
      db.select({ count: count() }).from(staked),
      db.select({ count: count() }).from(failedDeposit),
      db.select({ count: count() }).from(withdrawFinalized),
      db.select({ count: count() }).from(provider),
      db.select({ count: count() }).from(atpPosition),
      db.select({ count: count() }).from(deposit),
      calculateAPR(rollupAddress, client)
    ]);

    const atpDelegationsCount = Number(delegationsCountResult[0].count);
    const erc20DelegationsCount = Number(erc20DelegationsCountResult[0].count);
    const directStakesCount = Number(directStakesCountResult[0].count);  // ATP direct stakes only
    const failedDepositsLength = Number(failedDepositsLengthResult[0].count);
    const withdrawnCount = Number(withdrawnCountResult[0].count);
    const uniqueProvidersCount = Number(uniqueProvidersCountResult[0].count);
    const totalATPs = Number(totalATPsResult[0].count);
    const totalDepositsCount = Number(totalDepositsCountResult[0].count);

    // Total delegations includes both ATP-based and ERC20-based
    const totalDelegationsCount = atpDelegationsCount + erc20DelegationsCount;

    // Calculate ERC20 direct deposits (not tracked separately, derived from deposit table)
    // ERC20 direct deposits = Total deposits - ATP delegations - ERC20 delegations - ATP direct stakes
    // Note: This only counts activated validators, not those still in queue
    const erc20DirectDepositsRaw = totalDepositsCount - atpDelegationsCount - erc20DelegationsCount - directStakesCount;

    // Guard against negative values during re-indexing or data inconsistencies
    if (erc20DirectDepositsRaw < 0) {
      console.error('ERC20 direct deposits calculation is negative - data inconsistency detected', {
        result: erc20DirectDepositsRaw,
        timestamp: new Date().toISOString(),
        breakdown: {
          totalDepositsCount,
          atpDelegationsCount,
          erc20DelegationsCount,
          directStakesCount,
        },
        calculation: `${totalDepositsCount} - ${atpDelegationsCount} - ${erc20DelegationsCount} - ${directStakesCount} = ${erc20DirectDepositsRaw}`,
        note: 'ERC20 direct stakes are derived by subtraction. Negative value indicates event handler inconsistencies or re-indexing issues.'
      });
    }
    const erc20DirectDepositsCount = Math.max(0, erc20DirectDepositsRaw);

    // Calculate total stakes using deposit table as source of truth
    // The deposit table only contains SUCCESSFUL deposits (Rollup:Deposit events)
    // Failed deposits (Rollup:FailedDeposit events) are separate and NOT in the deposit table
    // Total active stakes = successful deposits - withdrawals
    // NOTE: Do NOT subtract failedDepositsLength here - failed deposits are never
    // added to the deposit table (they trigger a separate FailedDeposit event)
    const totalStakes = totalDepositsCount - withdrawnCount;
    const totalValueLocked = BigInt(activationThreshold) * BigInt(totalStakes);

    const response: StakingSummaryResponse = {
      totalValueLocked: totalValueLocked.toString(),
      totalStakers: totalStakes,
      currentAPR: currentAPR,
      stats: {
        totalStakes: totalStakes,
        delegatedStakes: totalDelegationsCount,
        atpDelegatedStakes: atpDelegationsCount,
        erc20DelegatedStakes: erc20DelegationsCount,
        directStakes: directStakesCount,
        erc20DirectStakes: erc20DirectDepositsCount,  // ERC20 direct deposits (own validator registrations)
        failedDeposits: failedDepositsLength,
        activeProviders: uniqueProvidersCount,
        totalATPs: totalATPs,
        activationThreshold: activationThreshold
      }
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching staking summary:', error);
    return c.json({ error: 'Failed to fetch staking summary' }, 500);
  }
}
