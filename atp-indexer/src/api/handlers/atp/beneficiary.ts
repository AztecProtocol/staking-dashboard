import type { Context } from 'hono';
import { db } from 'ponder:api';
import { eq, desc, sql, or } from 'drizzle-orm';
import { isAddress } from 'viem';
import { normalizeAddress, checksumAddress } from '../../../utils/address';
import type { ATPBeneficiaryResponse } from '../../types/atp.types';
import { atpPosition, tokensWithdrawnToBeneficiary, staked, stakedWithProvider, slashed } from 'ponder:schema';

/**
 * Handle GET /api/atp/beneficiary/:beneficiary
 * Get ATP positions for a beneficiary
 */
export async function handleATPByBeneficiary(c: Context): Promise<Response> {
  try {
    const beneficiary = c.req.param('beneficiary');
    const normalizedBeneficiary = normalizeAddress(beneficiary);

    // Get positions filtered with beneficiary
    // TODO : in the future when operator are not hardcoded to beneficiary, filter this with or operatorAddress
    // Note: withdrawalTimestamp for NCATPs is fetched directly from chain by the frontend
    const positions = await db.select()
      .from(atpPosition)
      .where(eq(atpPosition.beneficiary, normalizedBeneficiary as `0x${string}`))
      .orderBy(desc(atpPosition.blockNumber), desc(atpPosition.logIndex));

    // Get total withdrawn amounts for each ATP
    // Note: SQL sum() returns string for large integers, not bigint
    const withdrawalTotals = await db.select({
      atpAddress: tokensWithdrawnToBeneficiary.atpAddress,
      totalWithdrawn: sql<string>`sum(${tokensWithdrawnToBeneficiary.amount})`.as('total_withdrawn')
    })
      .from(tokensWithdrawnToBeneficiary)
      .where(eq(tokensWithdrawnToBeneficiary.beneficiary, normalizedBeneficiary as `0x${string}`))
      .groupBy(tokensWithdrawnToBeneficiary.atpAddress);

    // Create a map of ATP address to total withdrawn
    // Filter out null/undefined addresses and validate format for data safety
    const withdrawalMap = new Map(
      withdrawalTotals
        .filter((w): w is typeof w & { atpAddress: `0x${string}` } =>
          w.atpAddress != null && isAddress(w.atpAddress)
        ) // Type guard with address validation
        .map(w => {
          // Safely convert SQL sum result to bigint
          // SQL sum() returns numeric string or null for empty groups
          const totalStr = w.totalWithdrawn ?? '0';
          try {
            return [normalizeAddress(w.atpAddress), BigInt(totalStr)];
          } catch (error) {
            console.error(`Invalid totalWithdrawn value for ATP ${w.atpAddress}: "${totalStr}"`, error);
            return [normalizeAddress(w.atpAddress), 0n]; // Fallback to 0
          }
        })
    );

    // Get total slashed amounts by querying the slashed table
    // We need to:
    // 1. Get all attester addresses from direct stakes and delegations
    // 2. Sum slashed amounts by attester address
    // 3. Map back to ATPs via staker -> staked -> attester and ATP -> stakedWithProvider -> attester

    const stakerAddresses = positions.map(p => normalizeAddress(p.stakerAddress) as `0x${string}`);
    const atpAddresses = positions.map(p => normalizeAddress(p.address) as `0x${string}`);

    // Get direct stakes to find attester addresses
    const directStakes = stakerAddresses.length > 0
      ? await db.select({
          stakerAddress: staked.stakerAddress,
          attesterAddress: staked.attesterAddress
        })
          .from(staked)
          .where(or(...stakerAddresses.map(addr => eq(staked.stakerAddress, addr))))
      : [];

    // Get delegations to find attester addresses
    const delegations = atpAddresses.length > 0
      ? await db.select({
          atpAddress: stakedWithProvider.atpAddress,
          attesterAddress: stakedWithProvider.attesterAddress
        })
          .from(stakedWithProvider)
          .where(or(...atpAddresses.map(addr => eq(stakedWithProvider.atpAddress, addr))))
      : [];

    // Collect all unique attester addresses
    const allAttesterAddresses = new Set<`0x${string}`>();
    directStakes.forEach(s => allAttesterAddresses.add(normalizeAddress(s.attesterAddress) as `0x${string}`));
    delegations.forEach(d => allAttesterAddresses.add(normalizeAddress(d.attesterAddress) as `0x${string}`));

    // Query slashed table to get total slashed per attester
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

    // Create maps of staker -> totalSlashed and ATP -> totalSlashed
    // by summing slashed amounts for all attesters associated with each
    const stakerSlashMap = new Map<string, bigint>();
    directStakes.forEach(s => {
      const stakerAddr = normalizeAddress(s.stakerAddress);
      const attesterAddr = normalizeAddress(s.attesterAddress);
      const slashedAmount = attesterSlashMap.get(attesterAddr) ?? 0n;
      stakerSlashMap.set(stakerAddr, (stakerSlashMap.get(stakerAddr) ?? 0n) + slashedAmount);
    });

    const delegationSlashMap = new Map<string, bigint>();
    delegations.forEach(d => {
      const atpAddr = normalizeAddress(d.atpAddress);
      const attesterAddr = normalizeAddress(d.attesterAddress);
      const slashedAmount = attesterSlashMap.get(attesterAddr) ?? 0n;
      delegationSlashMap.set(atpAddr, (delegationSlashMap.get(atpAddr) ?? 0n) + slashedAmount);
    });

    const formattedPositions = positions.map((pos, index) => {
      const normalizedAddress = normalizeAddress(pos.address);
      const normalizedStakerAddress = normalizeAddress(pos.stakerAddress);

      // Total slashed = direct stakes slashed + delegations slashed
      const directStakeSlashed = stakerSlashMap.get(normalizedStakerAddress) ?? 0n;
      const delegationSlashed = delegationSlashMap.get(normalizedAddress) ?? 0n;
      const totalSlashed = directStakeSlashed + delegationSlashed;

      return {
        address: checksumAddress(pos.address),
        beneficiary: checksumAddress(pos.beneficiary),
        allocation: pos.allocation.toString(),
        type: pos.type,
        stakerAddress: checksumAddress(pos.stakerAddress),
        sequentialNumber: index + 1,
        timestamp: Number(pos.timestamp),
        totalWithdrawn: (withdrawalMap.get(normalizedAddress) ?? 0n).toString(),
        totalSlashed: totalSlashed.toString(),
      };
    });

    const response: ATPBeneficiaryResponse = {
      data: formattedPositions
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching ATP by beneficiary:', error);
    return c.json({ error: 'Failed to fetch ATP positions' }, 500);
  }
}
