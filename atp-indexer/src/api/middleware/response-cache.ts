import { Context, Next } from 'hono';

/**
 * Short-TTL response cache for the read-only /api/* GET routes.
 *
 * The dashboard polls the same handful of queries from every open session, so identical
 * requests land in bursts. Indexed data only changes ~per block (~12s), which makes a
 * few seconds of staleness invisible — one upstream execution per query shape per TTL
 * window absorbs the burst before it reaches Postgres.
 *
 * Dependency-free on purpose: a Map with insertion-order eviction is plenty for the
 * few dozen distinct query shapes the dashboard produces.
 */

interface CacheEntry {
  body: string;
  contentType: string;
  expiresAt: number;
}

const MAX_ENTRIES = 500;

export function responseCache(ttlMs: number) {
  const cache = new Map<string, CacheEntry>();

  return async (c: Context, next: Next) => {
    if (c.req.method !== 'GET') {
      return next();
    }

    const url = new URL(c.req.url);
    const key = url.pathname + url.search;
    const now = Date.now();

    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
      return new Response(hit.body, {
        status: 200,
        headers: { 'Content-Type': hit.contentType, 'X-Cache': 'HIT' },
      });
    }

    await next();

    if (c.res.status === 200) {
      const body = await c.res.clone().text();
      if (cache.size >= MAX_ENTRIES) {
        // Maps iterate in insertion order, so the first key is the oldest entry.
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(key, {
        body,
        contentType: c.res.headers.get('Content-Type') ?? 'application/json',
        expiresAt: now + ttlMs,
      });
      c.res.headers.set('X-Cache', 'MISS');
    }
  };
}
