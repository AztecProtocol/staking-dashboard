import type { Context } from 'hono';
import { db } from 'ponder:api';
import { eq, desc, count, or, and } from 'drizzle-orm';
import { checksumAddress, normalizeAddress } from '../../../utils/address';
import { getProviderMetadata } from '../../../utils/provider-metadata';
import type { ProviderDetailsResponse } from '../../types/provider.types';
import { fetchFailedDeposits, filterValidStakes } from '../../../utils/failed-deposits';
import { getActivationThreshold } from '../../../utils/rollup';
import { config } from '../../../config';
import { getPublicClient } from '../../../utils/viem-client';
import {
  provider,
  stakedWithProvider,
  erc20StakedWithProvider,
  providerTakeRateUpdate,
  staked,
  failedDeposit
} from 'ponder:schema';

/**
 * Handle GET /api/providers/:id
 * Get detailed information about a specific provider
 */
export async function handleProviderDetails(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    const client = getPublicClient();

    const [activationThreshold, providerData, allAtpDelegationsCount, allErc20DelegationsCount, allDirectStakesCount, allFailedDepositCount] = await Promise.all([
      getActivationThreshold(config.ROLLUP_ADDRESS, client),
      db.select().from(provider).where(eq(provider.providerIdentifier, id)).limit(1),
      db.select({ count: count() }).from(stakedWithProvider),
      db.select({ count: count() }).from(erc20StakedWithProvider),
      db.select({ count: count() }).from(staked),
      db.select({ count: count() }).from(failedDeposit)
    ]);

    if (!providerData || providerData.length === 0) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    const providerRecord = providerData[0];

    // Get provider stakes (ATP and ERC20) and take rate history
    const [atpDelegations, erc20Delegations, takeRateHistory] = await Promise.all([
      db.select().from(stakedWithProvider)
        .where(eq(stakedWithProvider.providerIdentifier, id))
        .orderBy(desc(stakedWithProvider.blockNumber), desc(stakedWithProvider.logIndex)),
      db.select().from(erc20StakedWithProvider)
        .where(eq(erc20StakedWithProvider.providerIdentifier, id))
        .orderBy(desc(erc20StakedWithProvider.blockNumber), desc(erc20StakedWithProvider.logIndex)),
      db.select().from(providerTakeRateUpdate)
        .where(eq(providerTakeRateUpdate.providerIdentifier, id))
        .orderBy(desc(providerTakeRateUpdate.timestamp))
    ]);

    // Combine ATP and ERC20 delegations
    const allDelegations = [
      ...atpDelegations.map(d => ({ ...d, _source: 'atp' as const })),
      ...erc20Delegations.map(d => ({ ...d, _source: 'erc20' as const }))
    ];

    // Build attester-withdrawer pairs from all delegations
    const attesterWithdrawerPairs = allDelegations
      .map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      }))
      .filter(pair => pair.attesterAddress !== '');

    // Fetch ALL direct stakes that share the same attester-withdrawer pairs
    // This is necessary for correct FIFO event consumption
    const directStakesWithSamePairs = attesterWithdrawerPairs.length > 0
      ? await db.select().from(staked)
          .where(
            or(
              ...attesterWithdrawerPairs.map(pair =>
                and(
                  eq(staked.attesterAddress, pair.attesterAddress as `0x${string}`),
                  eq(staked.stakerAddress, pair.withdrawerAddress as `0x${string}`)
                )
              )
            )
          )
      : [];

    // Fetch failed deposits to filter out invalid stakes
    const failedDepositMap = await fetchFailedDeposits(attesterWithdrawerPairs, db);

    // Combine all stakes to ensure proper FIFO event consumption
    const allStakes = [
      ...allDelegations.map(s => ({ ...s, _type: 'delegation' as const })),
      ...directStakesWithSamePairs.map(s => ({ ...s, _type: 'direct' as const }))
    ];
    const validAllStakes = filterValidStakes(allStakes, failedDepositMap);

    // Extract only the valid delegations (ignore direct stakes, they were just for FIFO)
    const validDelegations = validAllStakes.filter(s => s._type === 'delegation');

    // Calculate network total staked
    // All attempted stakes + all delegations (ATP + ERC20) - all failed deposits
    const totalDelegationsCount = allAtpDelegationsCount[0].count + allErc20DelegationsCount[0].count;
    const networkTotalStaked = BigInt(allDirectStakesCount[0].count + totalDelegationsCount - allFailedDepositCount[0].count) * BigInt(activationThreshold)

    const metadata = getProviderMetadata(providerRecord.providerIdentifier);

    const providerSelfStakeCount = metadata?.providerSelfStake?.length || 0

    // Calculate provider total staked amount + total provider self stake amount
    const totalProviderSelfStakes = BigInt(providerSelfStakeCount) * BigInt(activationThreshold)
    const totalDelegations = validDelegations.reduce((sum, stake) => {
      return sum + BigInt(stake.stakedAmount);
    }, 0n);
    const totalStaked = totalDelegations + totalProviderSelfStakes

    const response: ProviderDetailsResponse = {
      id: providerRecord.providerIdentifier,
      name: metadata?.providerName || `Provider ${providerRecord.providerIdentifier}`,
      description: metadata?.providerDescription || '',
      email: metadata?.providerEmail || '',
      website: metadata?.providerWebsite || '',
      logoUrl: metadata?.providerLogoUrl || '',
      discord: metadata?.discordUsername || '',
      commission: providerRecord.providerTakeRate,
      address: checksumAddress(providerRecord.providerAdmin),
      totalStaked: totalStaked.toString(),
      networkTotalStaked: networkTotalStaked.toString(),
      delegators: validDelegations.length + providerSelfStakeCount,
      createdAtBlock: providerRecord.blockNumber.toString(),
      createdAtTx: providerRecord.txHash,
      createdAtTime: Number(providerRecord.timestamp),

      // Showing all provider historical delegations without filter, so the user could know all of the split contract addresses
      stakes: allDelegations.map(stake => ({
        // ATP delegations have atpAddress, ERC20 delegations don't
        ...(stake._source === 'atp' && 'atpAddress' in stake && { atpAddress: checksumAddress(stake.atpAddress) }),
        stakerAddress: checksumAddress(stake.stakerAddress),
        splitContractAddress: checksumAddress(stake.splitContractAddress),
        rollupAddress: checksumAddress(stake.rollupAddress),
        attesterAddress: checksumAddress(stake.attesterAddress),
        stakedAmount: stake.stakedAmount.toString(),
        blockNumber: stake.blockNumber.toString(),
        txHash: stake.txHash,
        timestamp: Number(stake.timestamp),
        source: stake._source
      })),
      takeRateHistory: takeRateHistory.map(update => ({
        newTakeRate: update.newTakeRate,
        previousTakeRate: update.previousTakeRate,
        updatedAtBlock: update.blockNumber.toString(),
        updatedAtTx: update.txHash,
        updatedAtTime: Number(update.timestamp)
      })),
      ...(metadata?.providerSelfStake && metadata.providerSelfStake.length > 0 && {
        providerSelfStake: metadata.providerSelfStake.map(addr => checksumAddress(addr))
      })
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching provider details:', error);
    return c.json({ error: 'Failed to fetch provider details' }, 500);
  }
}
