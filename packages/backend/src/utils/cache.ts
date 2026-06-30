// Short-TTL in-memory cache for expensive aggregate queries that don't need
// real-time precision (dashboard counts, inventory summaries). Entries
// expire after `ttlMs` and are lazily refreshed on the next call.

interface CacheEntry<T> {
  value: T
  loadedAt: number
}

const entries = new Map<string, CacheEntry<unknown>>()

export function cached<T>(key: string, ttlMs: number, loader: () => T): T {
  const now = Date.now()
  const entry = entries.get(key) as CacheEntry<T> | undefined
  if (entry && now - entry.loadedAt < ttlMs) {
    return entry.value
  }
  const value = loader()
  entries.set(key, { value, loadedAt: now })
  return value
}

export function invalidateCache(key?: string): void {
  if (key) entries.delete(key)
  else entries.clear()
}
