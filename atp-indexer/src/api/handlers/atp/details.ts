import type { Context } from 'hono';
import { db } from 'ponder:api';
import { eq, desc, sql, or } from 'drizzle-orm';
import { normalizeAddress, checksumAddress } from '../../../utils/address';
import { getActivationThreshold } from '../../../utils/rollup';
import { config } from '../../../config';
import { getPublicClient } from '../../../utils/viem-client';
import type { ATPDetailsResponse } from '../../types/atp.types';
import { fetchFailedDeposits, markStakesWithFailedDeposits } from '../../../utils/failed-deposits';
import { getProviderMetadata } from '../../../utils/provider-metadata';
import {
  atpPosition,
  staked,
  stakedWithProvider,
  slashed
} from 'ponder:schema';

/**
 * Format direct stakes for response
 */
function formatDirectStakes(
  stakes: any[],
  activationThreshold: string,
  attesterSlashMap: Map<string, bigint>
) {
  return stakes.map(stake => {
    const attesterAddr = normalizeAddress(stake.attesterAddress);
    const totalSlashed = attesterSlashMap.get(attesterAddr) ?? 0n;
    return {
      attesterAddress: checksumAddress(stake.attesterAddress),
      operatorAddress: checksumAddress(stake.operatorAddress),
      stakedAmount: activationThreshold,
      totalSlashed: totalSlashed.toString(),
      txHash: stake.txHash,
      timestamp: Number(stake.timestamp),
      blockNumber: Number(stake.blockNumber),
      hasFailedDeposit: stake.hasFailedDeposit,
      failedDepositTxHash: stake.failedDepositTxHash,
      failureReason: stake.failureReason,
      status: stake.status
    };
  });
}

/**
 * Format delegations for response
 */
function formatDelegations(
  stakingOps: any[],
  activationThreshold: string,
  attesterSlashMap: Map<string, bigint>
) {
  return stakingOps
    .filter(op => op.providerIdentifier)
    .map((op) => {
      const providerId = parseInt(op.providerIdentifier);
      const metadata = getProviderMetadata(op.providerIdentifier);
      const attesterAddr = normalizeAddress(op.attesterAddress);
      const totalSlashed = attesterSlashMap.get(attesterAddr) ?? 0n;

      return {
        providerId,
        providerName: metadata?.providerName || `Provider ${providerId}`,
        providerLogo: metadata?.providerLogoUrl || '',
        operatorAddress: checksumAddress(op.attesterAddress),
        stakedAmount: activationThreshold,
        totalSlashed: totalSlashed.toString(),
        splitContract: checksumAddress(op.splitContractAddress),
        providerTakeRate: op.providerTakeRate,
        providerRewardsRecipient: checksumAddress(op.providerRewardsRecipient),
        txHash: op.txHash,
        timestamp: Number(op.timestamp),
        blockNumber: Number(op.blockNumber),
        hasFailedDeposit: op.hasFailedDeposit,
        failedDepositTxHash: op.failedDepositTxHash,
        failureReason: op.failureReason,
        status: op.status
      };
    });
}

/**
 * Handle GET /api/atp/:atpAddress/details
 * Get comprehensive details about an ATP including stakes and delegations
 */
export async function handleATPDetails(c: Context): Promise<Response> {
  try {
    const atpAddress = c.req.param('atpAddress');
    const normalizedAddress = normalizeAddress(atpAddress);
    const client = getPublicClient();

    // Get ATP details
    const atpPositionData = await db.select()
      .from(atpPosition)
      .where(eq(atpPosition.address, normalizedAddress as `0x${string}`))
      .limit(1);

    if (!atpPositionData || atpPositionData.length === 0) {
      return c.json({ error: 'ATP not found' }, 404);
    }

    const atp = atpPositionData[0];

    // Get the self stake done by this ATP
    const directStakes = await db.select()
      .from(staked)
      .where(eq(staked.stakerAddress, atp.stakerAddress as `0x${string}`))
      .orderBy(desc(staked.blockNumber), desc(staked.logIndex));

    // Get the delegations done by this ATP
    const delegations = await db.select()
      .from(stakedWithProvider)
      .where(eq(stakedWithProvider.atpAddress, normalizedAddress as `0x${string}`))
      .orderBy(desc(stakedWithProvider.blockNumber), desc(stakedWithProvider.logIndex));

    // Fetch failed deposits to filter out invalid stakes
    // Match by both attester address and withdrawer address (staker address)
    const attesterWithdrawerPairs = [
      ...directStakes.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      })),
      ...delegations.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      }))
    ].filter(pair => pair.attesterAddress !== '');

    const failedDepositMap = await fetchFailedDeposits(attesterWithdrawerPairs, db);

    // Mark stakes with failed deposits
    // Each failed deposit can only invalidate one stake
    // Combine all stakes to ensure proper FIFO event consumption
    const allStakes = [
      ...directStakes.map(s => ({ ...s, _type: 'direct' as const })),
      ...delegations.map(s => ({ ...s, _type: 'delegation' as const }))
    ];
    const markedAllStakes = markStakesWithFailedDeposits(allStakes, failedDepositMap);

    // Separate back into direct stakes and delegations
    const markedDirectStakes = markedAllStakes.filter(s => s._type === 'direct');
    const markedDelegations = markedAllStakes.filter(s => s._type === 'delegation');

    // Only count stakes that are not failed and not unstaked
    const isActiveStake = (s: { hasFailedDeposit: boolean; status?: string }) =>
      !s.hasFailedDeposit && s.status !== 'UNSTAKED';
    const validDirectStakesCount = markedDirectStakes.filter(isActiveStake).length;
    const validStakingOpsCount = markedDelegations.filter(isActiveStake).length;

    // Calculate total staked
    const activationThreshold = await getActivationThreshold(config.ROLLUP_ADDRESS, client);
    const totalStaked = BigInt(activationThreshold) * (BigInt(validDirectStakesCount) + BigInt(validStakingOpsCount));

    // Query slashed table to get total slashed per attester address
    const allAttesterAddresses = new Set<`0x${string}`>();
    markedDirectStakes.forEach(s => allAttesterAddresses.add(normalizeAddress(s.attesterAddress) as `0x${string}`));
    markedDelegations.forEach(d => allAttesterAddresses.add(normalizeAddress(d.attesterAddress) as `0x${string}`));

    const attesterSlashTotals = allAttesterAddresses.size > 0
      ? await db.select({
          attesterAddress: slashed.attesterAddress,
          totalSlashed: sql<string>`sum(${slashed.amount})`.as('total_slashed')
        })
          .from(slashed)
          .where(or(...Array.from(allAttesterAddresses).map(addr => eq(slashed.attesterAddress, addr))))
          .groupBy(slashed.attesterAddress)
      : [];

    // Create a map of attester address to total slashed
    const attesterSlashMap = new Map<string, bigint>(
      attesterSlashTotals.map(s => {
        const totalStr = s.totalSlashed ?? '0';
        try {
          return [normalizeAddress(s.attesterAddress), BigInt(totalStr)];
        } catch (error) {
          console.error(`Invalid totalSlashed value for attester ${s.attesterAddress}: "${totalStr}"`, error);
          return [normalizeAddress(s.attesterAddress), 0n];
        }
      })
    );

    // Calculate total slashed across all stakes and delegations
    const totalSlashed = Array.from(attesterSlashMap.values()).reduce((sum, val) => sum + val, 0n);


    // Begin format response
    const formattedDirectStakes = formatDirectStakes(markedDirectStakes, activationThreshold, attesterSlashMap);
    const formattedDelegations = formatDelegations(markedDelegations, activationThreshold, attesterSlashMap);

    const response: ATPDetailsResponse = {
      atp: {
        atpAddress: checksumAddress(atp.address),
        allocation: atp.allocation.toString(),
      },
      summary: {
        totalStaked: totalStaked.toString(),
        totalSlashed: totalSlashed.toString()
      },
      directStakes: formattedDirectStakes,
      delegations: formattedDelegations
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching ATP details:', error);
    return c.json({ error: 'Failed to fetch ATP details' }, 500);
  }
}
