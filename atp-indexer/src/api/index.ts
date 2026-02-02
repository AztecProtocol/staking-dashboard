import { Hono } from "hono";
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { globalLimiter } from './middleware/rate-limit';
import { healthRoutes } from './routes/health.routes';
import { providerRoutes } from './routes/provider.routes';
import { stakingRoutes } from './routes/staking.routes';
import { atpRoutes } from './routes/atp.routes';
import { config } from '../config';

/**
 * Ponder API for staking dashboard
 */

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Apply rate limiting only if enabled (disabled by default)
if (config.RATE_LIMIT_ENABLED) {
  app.use('/api/*', globalLimiter);
  console.log('Rate limiting enabled');
}

app.route('/api/health', healthRoutes);
app.route('/api/providers', providerRoutes);
app.route('/api/staking', stakingRoutes);
app.route('/api/atp', atpRoutes);

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: 'Internal server error',
    message: err.message
  }, 500);
});

export default app;