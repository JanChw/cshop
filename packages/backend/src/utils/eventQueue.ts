import { db } from '../db'
import { activityEvents, userOnline, settings, uploads } from '../db/schema'
import { eq, and, lt, isNull } from 'drizzle-orm'
import { readdir, unlink, stat } from 'node:fs/promises'
import { config } from '../config'
import type { DeviceType } from './deviceDetect'
import type { GeoResult } from './geo'

export interface TrackEvent {
  userId: number | null
  eventType: string
  path: string
  method?: string
  statusCode?: number
  duration?: number
  ip?: string
  userAgent?: string
  deviceType: DeviceType
  geo?: GeoResult
  metadata?: Record<string, unknown>
}

export interface OnlineUpsert {
  userId: number
  deviceType: DeviceType
  ip?: string
  userAgent?: string
  geo?: GeoResult
  isLogin?: boolean
}

const FLUSH_INTERVAL = 5_000
const FLUSH_THRESHOLD = 50

let eventQueue: TrackEvent[] = []
let onlineQueue: OnlineUpsert[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

export function enqueueEvent(event: TrackEvent): void {
  eventQueue.push(event)
  if (eventQueue.length >= FLUSH_THRESHOLD) {
    flush().catch(() => {})
  }
}

export function enqueueOnlineUpsert(upsert: OnlineUpsert): void {
  onlineQueue.push(upsert)
  if (onlineQueue.length >= FLUSH_THRESHOLD) {
    flush().catch(() => {})
  }
}

export function startFlushTimer(): void {
  if (flushTimer) return
  flushTimer = setInterval(() => { flush().catch(() => {}) }, FLUSH_INTERVAL)
  if (flushTimer && typeof flushTimer === 'object' && 'unref' in flushTimer) {
    flushTimer.unref()
  }
}

export async function flush(): Promise<void> {
  const events = eventQueue
  const onlines = onlineQueue
  eventQueue = []
  onlineQueue = []

  if (events.length === 0 && onlines.length === 0) {
    await lazyCleanUploads().catch(() => {})
    return
  }

  try {
    if (events.length > 0) {
      const values = events.map(e => ({
        userId: e.userId,
        eventType: e.eventType,
        path: e.path,
        method: e.method ?? null,
        statusCode: e.statusCode ?? null,
        duration: e.duration ?? null,
        ip: e.ip ?? null,
        userAgent: e.userAgent ?? null,
        deviceType: e.deviceType,
        country: e.geo?.country ?? null,
        region: e.geo?.region ?? null,
        city: e.geo?.city ?? null,
        metadata: e.metadata ? JSON.stringify(e.metadata) : null
      }))
      db.insert(activityEvents).values(values).run()
    }

    for (const o of onlines) {
      const now = new Date().toISOString()
      const geo = o.geo ?? { country: null, region: null, city: null }
      const existing = db
        .select({ userId: userOnline.userId })
        .from(userOnline)
        .where(and(eq(userOnline.userId, o.userId), eq(userOnline.deviceType, o.deviceType)))
        .limit(1)
        .all()

      if (existing.length > 0) {
        db.update(userOnline)
          .set({
            lastActiveAt: now,
            ip: o.ip ?? null,
            userAgent: o.userAgent ?? null,
            country: geo.country,
            region: geo.region,
            city: geo.city
          })
          .where(and(eq(userOnline.userId, o.userId), eq(userOnline.deviceType, o.deviceType)))
          .run()
      } else {
        db.insert(userOnline).values({
          userId: o.userId,
          deviceType: o.deviceType,
          loginAt: o.isLogin ? now : now,
          lastActiveAt: now,
          ip: o.ip ?? null,
          userAgent: o.userAgent ?? null,
          country: geo.country,
          region: geo.region,
          city: geo.city
        }).run()
      }
    }
  } catch (err) {
    console.error('[eventQueue] flush error:', err)
  }
}

export async function lazyClean(): Promise<void> {
  if (Math.random() > 0.01) return

  try {
    const [row] = db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'activity_retention_days')).limit(1).all()
    const days = row ? parseInt(row.value) : 30
    if (!Number.isFinite(days)) return

    db.delete(activityEvents)
      .where(lt(activityEvents.createdAt, new Date(Date.now() - days * 86400000).toISOString()))
      .run()

    const staleThreshold = new Date(Date.now() - 24 * 3600000).toISOString()
    db.delete(userOnline)
      .where(lt(userOnline.lastActiveAt, staleThreshold))
      .run()
  } catch (err) {
    console.error('[eventQueue] lazyClean error:', err)
  }
}

// Sweep upload directory for files not referenced by any upload row.
// 1% probability per call. Deletes orphans only — never touches referenced files.
export async function lazyCleanUploads(): Promise<void> {
  if (Math.random() > 0.01) return

  try {
    const rows = await readdir(config.uploadDir).catch(() => [] as string[])
    if (rows.length === 0) return

    const referenced = new Set<string>()
    const dbRows = db
      .select({
        thumb: uploads.thumbPath,
        small: uploads.smallPath,
        medium: uploads.mediumPath,
        large: uploads.largePath
      })
      .from(uploads)
      .all()
    for (const r of dbRows) {
      if (r.thumb) referenced.add(r.thumb)
      if (r.small) referenced.add(r.small)
      if (r.medium) referenced.add(r.medium)
      if (r.large) referenced.add(r.large)
    }

    for (const name of rows) {
      if (referenced.has(name)) continue
      const file = `${config.uploadDir}/${name}`
      const s = await stat(file).catch(() => null)
      if (!s?.isFile()) continue
      await unlink(file).catch(() => {})
    }
  } catch (err) {
    console.error('[eventQueue] lazyCleanUploads error:', err)
  }
}

export function resetQueue(): void {
  eventQueue = []
  onlineQueue = []
}
