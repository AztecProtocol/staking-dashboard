import {
  getTotalAttesterCount,
  calculateAPR
} from '../../../src/utils/rollup';
import type { PublicClient } from 'viem';

const MOCK_REWARD_CONFIG = {
  rewardDistributor: '0x0000000000000000000000000000000000000001',
  sequencerBps: 8000, 
  booster: '0x0000000000000000000000000000000000000002',
  blockReward: 5000000000000000000000n 
};
const MOCK_SLOT_DURATION = 72n; 
const MOCK_ACTIVATION_THRESHOLD = '200000000000000000000000'; 
const MOCK_ACTIVE_ATTESTERS = 250n;
const MOCK_QUEUE_LENGTH = 250n;
const MOCK_TOTAL_ATTESTERS = 500n; // active + queue
const EXPECTED_APR = 1752

describe('rollup', () => {
  let mockClient: jest.Mocked<PublicClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      readContract: jest.fn()
    } as any;
  });

  describe('getTotalAttesterCount', () => {
    it('should return sum of active attesters and entry queue', async () => {
      (mockClient.readContract as jest.Mock)
        .mockResolvedValueOnce(MOCK_ACTIVE_ATTESTERS)
        .mockResolvedValueOnce(MOCK_QUEUE_LENGTH);

      const result = await getTotalAttesterCount('0x1234567890123456789012345678901234567890', mockClient);

      expect(result).toBe(MOCK_TOTAL_ATTESTERS);
      expect(mockClient.readContract).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateAPR', () => {
    it('should calculate APR correctly with realistic mainnet values', async () => {
      (mockClient.readContract as jest.Mock)
        .mockResolvedValueOnce(MOCK_REWARD_CONFIG)      
        .mockResolvedValueOnce(MOCK_SLOT_DURATION)      
        .mockResolvedValueOnce(MOCK_ACTIVE_ATTESTERS)   
        .mockResolvedValueOnce(MOCK_QUEUE_LENGTH)       
        .mockResolvedValueOnce(MOCK_ACTIVATION_THRESHOLD); 

      const result = await calculateAPR('0x1234567890123456789012345678901234567890', mockClient);

      // Simulate APR calculation
      const totalBlockReward = BigInt(MOCK_REWARD_CONFIG.blockReward);
      const sequencerBps = BigInt(MOCK_REWARD_CONFIG.sequencerBps);
      const stakingRequirement = BigInt(MOCK_ACTIVATION_THRESHOLD);
      const secondsInYear = BigInt(365 * 24 * 60 * 60);

      // sequencerBlockReward = 5000 * 8000 / 10000 = 4000
      const sequencerBlockReward = (totalBlockReward * sequencerBps) / BigInt(10000);

      // slotsPerYear = 31536000 / 72 = 438000
      const slotsPerYear = secondsInYear / MOCK_SLOT_DURATION;

      // totalAnnualRewards = 4000 * 438000
      const totalAnnualRewards = sequencerBlockReward * slotsPerYear;

      // rewardsPerValidator = totalAnnualRewards / 100
      const rewardsPerValidator = totalAnnualRewards / MOCK_TOTAL_ATTESTERS;

      // aprBasisPoints = (rewardsPerValidator * 10000) / 200000
      const aprBasisPoints = (rewardsPerValidator * BigInt(10000)) / stakingRequirement;

      // expectedAPR = aprBasisPoints / 100 = 8760%
      const expectedAPR = Number(aprBasisPoints) / 100;

      expect(result).toBe(expectedAPR);
      expect(result).toBe(EXPECTED_APR);
      expect(result).toBeGreaterThan(0);
    });

  });
});
