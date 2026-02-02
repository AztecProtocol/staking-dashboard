import type { Context, Next } from 'hono';
import { config } from '../../config';

/**
 * Simple in-memory rate limiter 
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;
  private message: { error: string; retryAfter: string };

  constructor(windowMs: number, maxRequests: number, message: { error: string; retryAfter: string }) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  middleware() {
    return async (c: Context, next: Next) => {
      // Skip rate limiting if disabled
      if (!config.RATE_LIMIT_ENABLED) {
        await next();
        return;
      }

      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
      const now = Date.now();

      let entry = this.store.get(ip);

      if (!entry || now > entry.resetTime) {
        entry = {
          count: 0,
          resetTime: now + this.windowMs,
        };
        this.store.set(ip, entry);
      }

      entry.count++;

      // Set rate limit headers
      c.header('X-RateLimit-Limit', this.maxRequests.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, this.maxRequests - entry.count).toString());
      c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

      if (entry.count > this.maxRequests) {
        c.header('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
        return c.json(this.message, 429);
      }

      await next();
    };
  }
}

/**
 * Health check limiter - very permissive for monitoring systems
 */
export const healthCheckLimiter = new RateLimiter(
  1 * 60 * 1000, // 1 minute
  config.NODE_ENV === 'production' ? 60 : 1000, // 60 req/min = allows 1s interval checks
  {
    error: 'Too many health check requests.',
    retryAfter: '1 minute'
  }
).middleware();

/**
 * Global rate limiter - applies to all API endpoints
 */
export const globalLimiter = new RateLimiter(
  10 * 60 * 1000, // 10 minutes
  config.NODE_ENV === 'production' ? 200 : 1000, // 200 requests per 10min in prod
  {
    error: 'Too many requests, please try again later.',
    retryAfter: '10 minutes'
  }
).middleware();

/**
 * Polling-friendly limiter for endpoints called frequently by frontend
 * Used for: summary, beneficiary overview
 */
export const pollingLimiter = new RateLimiter(
  5 * 60 * 1000, // 5 minutes
  config.NODE_ENV === 'production' ? 120 : 500, // 120 req/5min
  {
    error: 'Too many requests to this endpoint, please try again later.',
    retryAfter: '5 minutes'
  }
).middleware();

/**
 * Moderate limiter for detail endpoints (ATP details, provider details)
 * Less frequently accessed than polling endpoints
 */
export const moderateLimiter = new RateLimiter(
  10 * 60 * 1000, // 10 minutes
  config.NODE_ENV === 'production' ? 100 : 200, // 100 requests per 10min in prod
  {
    error: 'Too many requests to this endpoint, please try again later.',
    retryAfter: '10 minutes'
  }
).middleware();
