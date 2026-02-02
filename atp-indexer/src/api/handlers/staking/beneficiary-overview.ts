import type { Context } from 'hono';
import { db } from 'ponder:api';
import { eq, inArray, desc } from 'drizzle-orm';
import { normalizeAddress, checksumAddress } from '../../../utils/address';
import type { BeneficiaryStakingOverviewResponse } from '../../types/staking.types';
import { fetchFailedDeposits, markStakesWithFailedDeposits } from '../../../utils/failed-deposits';
import { getProviderMetadata } from '../../../utils/provider-metadata';
import {
  atpPosition,
  staked,
  stakedWithProvider,
  erc20StakedWithProvider,
  deposit
} from 'ponder:schema';

/**
 * Handle GET /api/staking/:beneficiary
 * Get aggregated staking information for a beneficiary across all ATPs
 */
export async function handleBeneficiaryStakingOverview(c: Context): Promise<Response> {
  try {
    const beneficiary = c.req.param('beneficiary');
    const normalizedBeneficiary = normalizeAddress(beneficiary);

    // Find all ATP positions for this beneficiary
    const atpPositions = await db.select()
      .from(atpPosition)
      .where(eq(atpPosition.beneficiary, normalizedBeneficiary as `0x${string}`));

    // Also fetch ERC20 delegations directly by beneficiary address (no ATP needed)
    const erc20Delegations = await db.select().from(erc20StakedWithProvider)
      .where(eq(erc20StakedWithProvider.stakerAddress, normalizedBeneficiary as `0x${string}`))
      .orderBy(desc(erc20StakedWithProvider.timestamp));

    // Fetch all deposits where this beneficiary is the withdrawer (potential ERC20 direct deposits)
    const allDeposits = await db.select().from(deposit)
      .where(eq(deposit.withdrawerAddress, normalizedBeneficiary as `0x${string}`))
      .orderBy(desc(deposit.timestamp));

    // If no ATPs, no ERC20 delegations, and no deposits, return empty
    if ((!atpPositions || atpPositions.length === 0) && erc20Delegations.length === 0 && allDeposits.length === 0) {
      return c.json({
        totalStaked: '0',
        totalDirectStaked: '0',
        totalDelegated: '0',
        totalErc20Delegated: '0',
        totalErc20DirectStaked: '0',
        directStakeBreakdown: [],
        delegationBreakdown: [],
        erc20DelegationBreakdown: [],
        erc20DirectStakeBreakdown: []
      });
    }

    // Get all staker addresses for these ATPs
    const stakerAddresses = atpPositions.map(atp => atp.stakerAddress);

    // Fetch direct stakes and ATP delegations
    const [directStakes, delegations] = stakerAddresses.length > 0
      ? await Promise.all([
          db.select().from(staked)
            .where(inArray(staked.stakerAddress, stakerAddresses))
            .orderBy(desc(staked.timestamp)),
          db.select().from(stakedWithProvider)
            .where(inArray(stakedWithProvider.stakerAddress, stakerAddresses))
            .orderBy(desc(stakedWithProvider.timestamp))
        ])
      : [[], []];

    // Identify ERC20 direct deposits (deposits not tracked in other tables)
    // These are deposits where the user called Rollup.deposit() directly with ERC20 tokens
    const trackedAttesterAddresses = new Set([
      ...directStakes.map(s => normalizeAddress(s.attesterAddress)),
      ...delegations.map(s => normalizeAddress(s.attesterAddress)),
      ...erc20Delegations.map(s => normalizeAddress(s.attesterAddress))
    ]);

    const erc20DirectDeposits = allDeposits.filter(d =>
      !trackedAttesterAddresses.has(normalizeAddress(d.attesterAddress))
    );

    // Fetch failed deposits to mark stakes (includes ERC20 direct deposits for unified detection)
    const attesterWithdrawerPairs = [
      ...directStakes.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      })),
      ...delegations.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      })),
      ...erc20Delegations.map(s => ({
        attesterAddress: normalizeAddress(s.attesterAddress),
        withdrawerAddress: normalizeAddress(s.stakerAddress)
      })),
      ...erc20DirectDeposits.map(d => ({
        attesterAddress: normalizeAddress(d.attesterAddress),
        withdrawerAddress: normalizeAddress(d.withdrawerAddress)
      }))
    ].filter(pair => pair.attesterAddress !== '');

    const failedDepositMap = await fetchFailedDeposits(attesterWithdrawerPairs, db);

    // Mark stakes with failed deposits
    // Combine all stakes to ensure proper FIFO event consumption
    // Convert ERC20 direct deposits to stake-like objects (map withdrawerAddress to stakerAddress)
    const allStakes = [
      ...directStakes.map(s => ({ ...s, _type: 'direct' as const })),
      ...delegations.map(s => ({ ...s, _type: 'delegation' as const })),
      ...erc20Delegations.map(s => ({ ...s, _type: 'erc20Delegation' as const })),
      ...erc20DirectDeposits.map(d => ({
        ...d,
        stakerAddress: d.withdrawerAddress, // Map for unified processing
        _type: 'erc20Direct' as const
      }))
    ];
    const markedAllStakes = markStakesWithFailedDeposits(allStakes, failedDepositMap);

    // Separate back into direct stakes, ATP delegations, ERC20 delegations, and ERC20 direct deposits
    const markedDirectStakes = markedAllStakes.filter(s => s._type === 'direct');
    const markedDelegations = markedAllStakes.filter(s => s._type === 'delegation');
    const markedErc20Delegations = markedAllStakes.filter(s => s._type === 'erc20Delegation');
    const markedErc20DirectDeposits = markedAllStakes.filter(s => s._type === 'erc20Direct');

    // Create ATP address lookup map
    const atpByStaker = new Map(atpPositions.map(atp => [atp.stakerAddress.toLowerCase(), atp.address]));

    // Format direct stakes
    const directStakeBreakdown = markedDirectStakes.map(stake => ({
      atpAddress: checksumAddress(atpByStaker.get(stake.stakerAddress.toLowerCase()) || stake.atpAddress),
      attesterAddress: checksumAddress(stake.attesterAddress),
      stakedAmount: stake.stakedAmount.toString(),
      hasFailedDeposit: stake.hasFailedDeposit,
      failedDepositTxHash: stake.failedDepositTxHash,
      failureReason: stake.failureReason,
      status: stake.status,
      txHash: stake.txHash,
      timestamp: Number(stake.timestamp),
      blockNumber: Number(stake.blockNumber)
    }));

    // Format delegations with provider metadata
    const delegationBreakdown = markedDelegations.map(delegation => {
      const providerId = parseInt(delegation.providerIdentifier);
      const metadata = getProviderMetadata(delegation.providerIdentifier);

      return {
        atpAddress: checksumAddress(delegation.atpAddress),
        providerId,
        providerName: metadata?.providerName || `Provider ${providerId}`,
        providerLogo: metadata?.providerLogoUrl || '',
        attesterAddress: checksumAddress(delegation.attesterAddress),
        stakedAmount: delegation.stakedAmount.toString(),
        splitContract: checksumAddress(delegation.splitContractAddress),
        providerTakeRate: delegation.providerTakeRate,
        providerRewardsRecipient: checksumAddress(delegation.providerRewardsRecipient),
        txHash: delegation.txHash,
        timestamp: Number(delegation.timestamp),
        blockNumber: Number(delegation.blockNumber),
        hasFailedDeposit: delegation.hasFailedDeposit,
        failedDepositTxHash: delegation.failedDepositTxHash,
        failureReason: delegation.failureReason,
        status: delegation.status
      };
    });

    // Format ERC20 delegations (separate array - no ATP address)
    const erc20DelegationBreakdown = markedErc20Delegations.map(delegation => {
      const providerId = parseInt(delegation.providerIdentifier);
      const metadata = getProviderMetadata(delegation.providerIdentifier);

      return {
        providerId,
        providerName: metadata?.providerName || `Provider ${providerId}`,
        providerLogo: metadata?.providerLogoUrl || '',
        attesterAddress: checksumAddress(delegation.attesterAddress),
        stakedAmount: delegation.stakedAmount.toString(),
        splitContract: checksumAddress(delegation.splitContractAddress),
        providerTakeRate: delegation.providerTakeRate,
        providerRewardsRecipient: checksumAddress(delegation.providerRewardsRecipient),
        txHash: delegation.txHash,
        timestamp: Number(delegation.timestamp),
        blockNumber: Number(delegation.blockNumber),
        hasFailedDeposit: delegation.hasFailedDeposit,
        failedDepositTxHash: delegation.failedDepositTxHash,
        failureReason: delegation.failureReason,
        status: delegation.status
      };
    });

    // Format ERC20 direct deposits using unified marked stakes
    const erc20DirectStakeBreakdown = markedErc20DirectDeposits.map(dep => ({
      attesterAddress: checksumAddress(dep.attesterAddress),
      withdrawerAddress: checksumAddress(dep.withdrawerAddress),
      stakedAmount: dep.amount.toString(),
      txHash: dep.txHash,
      timestamp: Number(dep.timestamp),
      blockNumber: Number(dep.blockNumber),
      hasFailedDeposit: dep.hasFailedDeposit,
      failedDepositTxHash: dep.failedDepositTxHash,
      failureReason: dep.failureReason,
      status: dep.status
    }));

    // Only count stakes that are not failed and not unstaked
    const isActiveStake = (s: { hasFailedDeposit: boolean; status?: string }) =>
      !s.hasFailedDeposit && s.status !== 'UNSTAKED';
    const totalDirectStaked = markedDirectStakes.filter(isActiveStake).reduce((a, b) => a + b.stakedAmount, 0n);
    const totalDelegated = markedDelegations.filter(isActiveStake).reduce((a, b) => a + b.stakedAmount, 0n);
    const totalErc20Delegated = markedErc20Delegations.filter(isActiveStake).reduce((a, b) => a + b.stakedAmount, 0n);
    // IMPORTANT: totalErc20DirectStaked is derived from the SAME source as erc20DirectStakeBreakdown
    // (both use markedErc20DirectDeposits). This consistency is critical for frontend deduplication
    // logic - the frontend can safely filter pending stakes based on breakdown attester addresses.
    const totalErc20DirectStaked = markedErc20DirectDeposits.filter(isActiveStake).reduce((a, b) => a + b.amount, 0n);
    const totalStaked = totalDirectStaked + totalDelegated + totalErc20Delegated + totalErc20DirectStaked;

    const response: BeneficiaryStakingOverviewResponse = {
      totalStaked: totalStaked.toString(),
      totalDirectStaked: totalDirectStaked.toString(),
      totalDelegated: totalDelegated.toString(),
      totalErc20Delegated: totalErc20Delegated.toString(),
      totalErc20DirectStaked: totalErc20DirectStaked.toString(),
      directStakeBreakdown,
      delegationBreakdown,
      erc20DelegationBreakdown,
      erc20DirectStakeBreakdown
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching beneficiary staking overview:', error);
    return c.json({ error: 'Failed to fetch beneficiary staking overview' }, 500);
  }
}
