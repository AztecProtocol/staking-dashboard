import type { Context } from 'hono';
import type { HealthResponse } from '../types/common.types';

/**
 * Handle GET /api/health
 * Health check endpoint for monitoring
 */
export async function handleHealthCheck(c: Context): Promise<Response> {
  try {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    };

    return c.json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    const errorResponse: HealthResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    };
    return c.json(errorResponse, 500);
  }
}
