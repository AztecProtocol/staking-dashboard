import { ROLLUP_ABI, ROLLUP_FUNCTIONS } from "../abis";
import { config } from "../config";
import type { PublicClient, Address } from 'viem';

// APR Cache
let cachedAPR: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 0.5 * 60 * 1000; // 30s

/**
 * Get activation threshold from Rollup contract
 */
export async function getActivationThreshold(
  rollupAddress: `0x${string}` | string,
  client: any
): Promise<string> {
  try {
    const threshold = await client.readContract({
      address: rollupAddress as Address,
      abi: ROLLUP_ABI,
      functionName: "getActivationThreshold",
    });

    return (threshold as bigint).toString();
  } catch (error) {
    console.error(`Failed to get activation threshold for ${rollupAddress}:`, error);
    return '0';
  }
}

/**
 * Gets reward configuration from rollup contract
 */
export async function getRewardConfig(rollupAddress: string, client: PublicClient) {
  try {
    const config = await client.readContract({
      address: rollupAddress as Address,
      abi: ROLLUP_ABI,
      functionName: 'getRewardConfig',
    });

    return config;
  } catch (error) {
    console.error(`Error getting reward config for rollup ${rollupAddress}:`, error);
    throw error;
  }
}

/**
 * Gets slot duration from rollup contract
 */
export async function getSlotDuration(rollupAddress: string, client: PublicClient): Promise<bigint> {
  try {
    const duration = await client.readContract({
      address: rollupAddress as Address,
      abi: ROLLUP_ABI,
      functionName: 'getSlotDuration',
    });

    return duration as bigint;
  } catch (error) {
    console.error(`Error getting slot duration for rollup ${rollupAddress}:`, error);
    throw error;
  }
}

/**
 * Gets active attester count from rollup contract
 */
export async function getActiveAttesterCount(rollupAddress: string, client: PublicClient): Promise<bigint> {
  try {
    const count = await client.readContract({
      address: rollupAddress as Address,
      abi: ROLLUP_ABI,
      functionName: 'getActiveAttesterCount',
    });

    return count as bigint;
  } catch (error) {
    console.error(`Error getting active attester count for rollup ${rollupAddress}:`, error);
    throw error;
  }
}

/**
 * Gets entry queue length from rollup contract
 */
export async function getEntryQueueLength(rollupAddress: string, client: PublicClient): Promise<bigint> {
  try {
    const length = await client.readContract({
      address: rollupAddress as Address,
      abi: ROLLUP_ABI,
      functionName: 'getEntryQueueLength',
    });

    return length as bigint;
  } catch (error) {
    console.error(`Error getting entry queue length for rollup ${rollupAddress}:`, error);
    throw error;
  }
}

/**
 * Gets total attester count (active + queued)
 */
export async function getTotalAttesterCount(rollupAddress: string, client: PublicClient): Promise<bigint> {
  try {
    const [activeCount, queueLength] = await Promise.all([
      getActiveAttesterCount(rollupAddress, client),
      getEntryQueueLength(rollupAddress, client)
    ]);

    return activeCount + queueLength;
  } catch (error) {
    console.error(`Error getting total attester count for rollup ${rollupAddress}:`, error);
    throw error;
  }
}

/**
 * Calculate estimated APR for staking with caching
 * Formula: (rewardsPerValidator / stakingRequirement) * 100
 */
export async function calculateAPR(rollupAddress: string, client: PublicClient): Promise<number> {
  if (cachedAPR !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedAPR;
  }

  try {
    // Get all required data from rollup contract
    const [rewardConfig, slotDuration, totalAttesterCount, activationThreshold] = await Promise.all([
      getRewardConfig(rollupAddress, client),
      getSlotDuration(rollupAddress, client),
      getTotalAttesterCount(rollupAddress, client),
      getActivationThreshold(rollupAddress, client),
    ]);

    const totalBlockReward = BigInt(rewardConfig.blockReward);
    const sequencerBps = BigInt(rewardConfig.sequencerBps);
    const stakingRequirement = BigInt(activationThreshold);

    const secondsInYear = BigInt(365 * 24 * 60 * 60); 

    // Calculate sequencer portion of block reward (sequencerBps / 10000)
    const sequencerBlockReward = (totalBlockReward * sequencerBps) / BigInt(10000);

    // Calculate total annual rewards for all validators (sequencer portion only)
    const slotsPerYear = secondsInYear / slotDuration;
    const totalAnnualRewards = sequencerBlockReward * slotsPerYear;

    const rewardsPerValidator = totalAttesterCount > 0n
      ? totalAnnualRewards / totalAttesterCount
      : totalAnnualRewards;

    // Using basis points for precision
    const aprBasisPoints = stakingRequirement > 0n
      ? (rewardsPerValidator * BigInt(10000)) / stakingRequirement
      : BigInt(0);

    const apr = Number(aprBasisPoints) / 100;

    cachedAPR = apr;
    cacheTimestamp = Date.now();

    return apr;
  } catch (error) {
    console.error('Error calculating APR:', error);
    // Return cached value if available, otherwise 0
    return cachedAPR !== null ? cachedAPR : 0.0;
  }
}
