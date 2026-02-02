import { Hono } from 'hono';
import { handleStakingSummary } from '../handlers/staking/summary';
import { handleBeneficiaryStakingOverview } from '../handlers/staking/beneficiary-overview';
import { pollingLimiter } from '../middleware/rate-limit';

export const stakingRoutes = new Hono();

/**
 * GET /api/staking/summary
 * Get overall staking network statistics
 */
stakingRoutes.get('/summary', pollingLimiter, handleStakingSummary);

/**
 * GET /api/staking/:beneficiary
 * Get aggregated staking information for a beneficiary
 */
stakingRoutes.get('/:beneficiary', pollingLimiter, handleBeneficiaryStakingOverview);
