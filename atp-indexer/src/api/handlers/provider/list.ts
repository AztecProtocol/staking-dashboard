import type { Context } from 'hono';
import { db } from 'ponder:api';
import { inArray } from 'drizzle-orm';
import { checksumAddress, normalizeAddress } from '../../../utils/address';
import { getAllProviderMetadata } from '../../../utils/provider-metadata';
import type { ProviderListResponse } from '../../types/provider.types';
import { fetchFailedDeposits, markStakesWithFailedDeposits } from '../../../utils/failed-deposits';
import { getActivationThreshold } from '../../../utils/rollup';
import { config } from '../../../config';
import { getPublicClient } from '../../../utils/viem-client';
import {
  provider,
  stakedWithProvider,
  erc20StakedWithProvider,
  staked
} from 'ponder:schema';

/**
 * Handle GET /api/providers
 * List all providers in frontend-compatible format
 */
export async function handleProviderList(c: Context): Promise<Response> {
  try {
    const metadata = getAllProviderMetadata();
    const client = getPublicClient();

    // Get provider list of IDs from JSON
    const providerIds = Array.from(metadata.keys());

    const [activationThreshold, dbProviders, atpDelegations, erc20Delegations, allDirectStakes] = await Promise.all([
      getActivationThreshold(config.ROLLUP_ADDRESS, client),
      db.select().from(provider).where(inArray(provider.providerIdentifier, providerIds)),
      db.select({
        providerIdentifier: stakedWithProvider.providerIdentifier,
        attesterAddress: stakedWithProvider.attesterAddress,
        stakerAddress: stakedWithProvider.stakerAddress,
        stakedAmount: stakedWithProvider.stakedAmount,
        timestamp: stakedWithProvider.timestamp,
        blockNumber: stakedWithProvider.blockNumber,
        logIndex: stakedWithProvider.logIndex,
      }).from(stakedWithProvider),
      db.select({
        providerIdentifier: erc20StakedWithProvider.providerIdentifier,
        attesterAddress: erc20StakedWithProvider.attesterAddress,
        stakerAddress: erc20StakedWithProvider.stakerAddress,
        stakedAmount: erc20StakedWithProvider.stakedAmount,
        timestamp: erc20StakedWithProvider.timestamp,
        blockNumber: erc20StakedWithProvider.blockNumber,
        logIndex: erc20StakedWithProvider.logIndex,
      }).from(erc20StakedWithProvider),
      db.select({
        attesterAddress: staked.attesterAddress,
        stakerAddress: staked.stakerAddress,
        timestamp: staked.timestamp,
        blockNumber: staked.blockNumber,
        logIndex: staked.logIndex,
        stakedAmount: staked.stakedAmount
      }).from(staked)
    ]);

    // Combine ATP-based and ERC20-based delegations
    const allDelegations = [...atpDelegations, ...erc20Delegations];

    // Fetch failed deposits to filter out invalid stakes
    const attesterWithdrawerPairs = [
      ...allDelegations.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      })),
      ...allDirectStakes.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      }))
    ].filter(pair => pair.attesterAddress !== '');

    const failedDepositMap = await fetchFailedDeposits(attesterWithdrawerPairs, db);

    // Mark stakes with failed deposits and withdrawal status
    // Combine all stakes to ensure proper FIFO event consumption
    const allStakes = [
      ...allDelegations.map(s => ({ ...s, _type: 'delegation' as const })),
      ...allDirectStakes.map(s => ({ ...s, _type: 'direct' as const }))
    ];
    const markedAllStakes = markStakesWithFailedDeposits(allStakes, failedDepositMap);

    // Filter out failed deposits and unstaked (withdrawn) stakes
    const isActiveStake = (s: { hasFailedDeposit: boolean; status?: string }) =>
      !s.hasFailedDeposit && s.status !== 'UNSTAKED';
    const validAllStakes = markedAllStakes.filter(isActiveStake);

    // Separate back into delegations and direct stakes
    const validDelegations = validAllStakes.filter(s => s._type === 'delegation');
    const validDirectStakes = validAllStakes.filter(s => s._type === 'direct');

    // Group valid delegations by provider
    const stakesByProvider = new Map<string, typeof validDelegations>();
    const unassociatedStakesWithProvider: typeof validDelegations = [];

    for (const stake of validDelegations) {
      if (providerIds.includes(stake.providerIdentifier)) {
        if (!stakesByProvider.has(stake.providerIdentifier)) {
          stakesByProvider.set(stake.providerIdentifier, []);
        }
        stakesByProvider.get(stake.providerIdentifier)!.push(stake);
      } else {
        unassociatedStakesWithProvider.push(stake);
      }
    }

    const totalDirectStakeAmount = validDirectStakes.reduce((sum, stake) => {
      return sum + BigInt(stake.stakedAmount);
    }, 0n)
    const totalProviderStakeAmount = validDelegations.reduce((sum, stake) => {
      return sum + BigInt(stake.stakedAmount);
    }, 0n)

    // Calculate total staked across entire network (from valid stakes only)
    const networkTotalStaked = totalProviderStakeAmount + totalDirectStakeAmount

    let totalProviderSelfStakeAmount: bigint = 0n
    let totalProviderSelfStakeCount: number = 0

    // Only return provider list with metadata
    const formattedProviders = dbProviders.map((provider) => {
      const meta = metadata.get(provider.providerIdentifier);
      const providerStakes = stakesByProvider.get(provider.providerIdentifier) || [];

      // Get self-stake count
      // This is to accumulate self stakes into provider with metadata
      const selfStakeCount = meta?.providerSelfStake?.length || 0;
      const selfStakeAmount = BigInt(selfStakeCount) * BigInt(activationThreshold);

      // Add provider self stake count to provider stakes
      const delegationsWithSelfStake = providerStakes.length + selfStakeCount;

      const providerTotalStaked = providerStakes.reduce((sum, stake) => {
        return sum + BigInt(stake.stakedAmount);
      }, 0n) + selfStakeAmount;

      totalProviderSelfStakeAmount += selfStakeAmount
      totalProviderSelfStakeCount += selfStakeCount

      return {
        id: provider.providerIdentifier,
        name: meta?.providerName || `Provider ${provider.providerIdentifier}`,
        commission: provider.providerTakeRate,
        delegators: delegationsWithSelfStake,
        totalStaked: providerTotalStaked.toString(),
        address: checksumAddress(provider.providerAdmin),
        description: meta?.providerDescription || '',
        website: meta?.providerWebsite || '',
        logo_url: meta?.providerLogoUrl || '',
        email: meta?.providerEmail || '',
        discord: meta?.discordUsername || '',
        ...(meta?.providerSelfStake && meta.providerSelfStake.length > 0 && {
          providerSelfStake: meta.providerSelfStake.map(addr => checksumAddress(addr))
        })
      };
    });


    // Accumulated stakes from unknown provider & self stake
    // Total delegations to provider without metadata + unknwon self stake - provider self stake
    const totalUnassociatedCount = unassociatedStakesWithProvider.length + validDirectStakes.length - totalProviderSelfStakeCount;

    let notAssociatedStake = undefined;

    if (totalUnassociatedCount > 0) {
      const unassociatedTotalStakedWithProvider = unassociatedStakesWithProvider.reduce((sum, stake) => {
        return sum + BigInt(stake.stakedAmount);
      }, 0n)

      const unassociatedTotalStaked = unassociatedTotalStakedWithProvider + totalDirectStakeAmount - totalProviderSelfStakeAmount

      notAssociatedStake = {
        delegators: totalUnassociatedCount,
        totalStaked: unassociatedTotalStaked.toString()
      };
    }

    const response: ProviderListResponse = {
      providers: formattedProviders,
      totalStaked: networkTotalStaked.toString(),
      notAssociatedStake
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching providers:', error);
    return c.json({ error: 'Failed to fetch providers' }, 500);
  }
}
