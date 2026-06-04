/**
 * Rate limit in-memory simple — convient pour dev et déploiement single-instance.
 * Pour multi-instance (Vercel edge, plusieurs régions), basculer sur Upstash Redis :
 *   RATE_LIMIT_REDIS_URL=...
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs: number; // fenêtre glissante en ms
  max: number; // requêtes max dans la fenêtre
};

const DEFAULT: RateLimitOptions = {
  windowMs: 60_000, // 1 minute
  max: 6,
};

export function rateLimit(
  key: string,
  options: Partial<RateLimitOptions> = {},
): { ok: boolean; remaining: number; resetAt: number } {
  const opts = { ...DEFAULT, ...options };
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.max - 1, resetAt };
  }

  if (existing.count >= opts.max) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: opts.max - existing.count, resetAt: existing.resetAt };
}

/** Garbage collection occasionnelle pour éviter la fuite mémoire. */
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets.entries()) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}, 60_000);

/** Extrait l'IP client la plus fiable possible depuis les headers. */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
