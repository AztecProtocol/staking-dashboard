import { Hono } from 'hono';
import { handleATPByBeneficiary } from '../handlers/atp/beneficiary';
import { handleATPDetails } from '../handlers/atp/details';
import { moderateLimiter } from '../middleware/rate-limit';

export const atpRoutes = new Hono();

/**
 * GET /api/atp/beneficiary/:beneficiary
 * Get ATP positions for a beneficiary
 */
atpRoutes.get('/beneficiary/:beneficiary', moderateLimiter, handleATPByBeneficiary);

/**
 * GET /api/atp/:atpAddress/details
 * Get comprehensive details about an ATP including stakes and delegations
 */
atpRoutes.get('/:atpAddress/details', moderateLimiter, handleATPDetails);
