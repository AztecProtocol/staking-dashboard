import { Hono } from 'hono';
import { handleHealthCheck } from '../handlers/health';
import { healthCheckLimiter } from '../middleware/rate-limit';

export const healthRoutes = new Hono();

/**
 * GET /api/health
 * Health check endpoint for monitoring indexer status
 */
healthRoutes.get('/', healthCheckLimiter, handleHealthCheck);
