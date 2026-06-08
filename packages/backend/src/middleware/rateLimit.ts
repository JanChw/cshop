import { createMiddleware } from 'hono/factory'
import { fail } from '../utils/response'

interface Bucket {
  count: number
  resetAt: number
}

interface Options {
  // Sliding-window-style: max `limit` requests per `windowMs` per key.
  limit: number
  windowMs: number
  // Key derivation. Defaults to IP from x-forwarded-for or remote address.
  keyFor?: (req: Request) => string
  // Cap on stored keys to bound memory. Oldest entries evicted.
  maxKeys?: number
}

// Get a stable key for a request. CF/proxy headers preferred, falls back
// to a generic 'unknown' (still rate-limited as a single bucket — safer
// than letting it escape limiting).
function defaultKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export function rateLimit(opts: Options) {
  const limit = opts.limit
  const windowMs = opts.windowMs
  const maxKeys = opts.maxKeys ?? 10_000
  const keyFor = opts.keyFor ?? defaultKey

  // Map preserves insertion order; we use it as a tiny LRU.
  const buckets = new Map<string, Bucket>()

  return createMiddleware(async (c, next) => {
    // Disabled in tests; otherwise auth-throttling tests would have to
    // tear down state across files.
    if (process.env.RATE_LIMIT_DISABLED === '1') {
      await next()
      return
    }

    const now = Date.now()
    const key = keyFor(c.req.raw)

    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.delete(key) // refresh insertion order
    } else {
      buckets.delete(key)
    }
    bucket.count++
    buckets.set(key, bucket)

    // LRU eviction: drop oldest until under cap.
    while (buckets.size > maxKeys) {
      const oldest = buckets.keys().next().value
      if (oldest === undefined) break
      buckets.delete(oldest)
    }

    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      c.header('Retry-After', String(retryAfter))
      return fail(c, '请求过于频繁，请稍后再试', 429)
    }

    await next()
  })
}
