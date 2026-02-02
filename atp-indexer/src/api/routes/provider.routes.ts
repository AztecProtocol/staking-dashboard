import { Hono } from 'hono';
import { handleProviderList } from '../handlers/provider/list';
import { handleProviderDetails } from '../handlers/provider/details';
import { moderateLimiter } from '../middleware/rate-limit';

export const providerRoutes = new Hono();

/**
 * GET /api/providers
 * List all providers (lightweight, uses global limiter only)
 */
providerRoutes.get('/', handleProviderList);

/**
 * GET /api/providers/:id
 * Get detailed information about a specific provider
 */
providerRoutes.get('/:id', moderateLimiter, handleProviderDetails);
