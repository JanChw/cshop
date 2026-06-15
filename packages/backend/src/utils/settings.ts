import { db } from '../db'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'

interface CacheEntry {
  value: string
  loadedAt: number
}

const TTL_MS = 1000
const cache = new Map<string, CacheEntry>()

export function getSetting(key: string, fallback = ''): string {
  const now = Date.now()
  const entry = cache.get(key)
  if (entry && now - entry.loadedAt < TTL_MS) {
    return entry.value
  }
  const [row] = db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1).all()
  const value = row?.value ?? fallback
  cache.set(key, { value, loadedAt: now })
  return value
}

export function getBool(key: string, fallback = false): boolean {
  const v = getSetting(key, fallback ? 'true' : 'false')
  return v === 'true' || v === '1'
}

export function getInt(key: string, fallback = 0): number {
  const v = getSetting(key, String(fallback))
  const n = parseInt(v)
  return Number.isFinite(n) ? n : fallback
}

export function invalidate(key?: string): void {
  if (key) cache.delete(key)
  else cache.clear()
}
