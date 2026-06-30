import { db } from '../db'
import { activityEvents, userOnline, settings, uploads, products, cartItems, designs, orderItems } from '../db/schema'
import { eq, and, lt, gte, isNull, isNotNull, inArray, sql } from 'drizzle-orm'
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
    // Wrap all writes in one transaction so WAL fsync happens once instead
    // of once per statement.
    db.transaction(() => {
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

      const now = new Date().toISOString()
      const resolvedGeo = onlines.map(o => o.geo ?? { country: null, region: null, city: null })

      // Batch-select existing (userId, deviceType) rows once, then split the
      // queue into insert vs update buckets. Reduces 2*N queries to 1 select
      // + 1 bulk insert + (updates, which are bounded by active session count).
      const userIds = [...new Set(onlines.map(o => o.userId))]
      const existing = userIds.length > 0
        ? db.select({ userId: userOnline.userId, deviceType: userOnline.deviceType }).from(userOnline).where(inArray(userOnline.userId, userIds)).all()
        : []
      const existingKeys = new Set(existing.map(e => `${e.userId}|${e.deviceType}`))

      const toInsertIdx: number[] = []
      const toUpdateIdx: number[] = []
      onlines.forEach((o, i) => {
        if (existingKeys.has(`${o.userId}|${o.deviceType}`)) toUpdateIdx.push(i)
        else toInsertIdx.push(i)
      })

      if (toInsertIdx.length > 0) {
        db.insert(userOnline).values(toInsertIdx.map(i => {
          const o = onlines[i]
          const geo = resolvedGeo[i]
          return {
            userId: o.userId,
            deviceType: o.deviceType,
            loginAt: now,
            lastActiveAt: now,
            ip: o.ip ?? null,
            userAgent: o.userAgent ?? null,
            country: geo.country,
            region: geo.region,
            city: geo.city
          }
        })).run()
      }

      for (const i of toUpdateIdx) {
        const o = onlines[i]
        const geo = resolvedGeo[i]
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
      }
    })
  } catch (err) {
    console.error('[eventQueue] flush error:', err)
  }
}

export async function lazyClean(): Promise<void> {
  if (Math.random() > 0.01) return

  try {
    const [row] = db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'trash_retention_days')).limit(1).all()
    const days = row ? parseInt(row.value) : 30
    if (!Number.isFinite(days) || days < 0) return

    if (days > 0) {
      const trashThreshold = new Date(Date.now() - days * 86400000).toISOString()
      const candidates = db.select({ id: products.id })
        .from(products)
        .where(and(isNotNull(products.deletedAt), lt(products.deletedAt, trashThreshold)))
        .all()
      if (candidates.length > 0) {
        const ids = candidates.map(c => c.id)
        const withOrders = db.select({ id: orderItems.productId })
          .from(orderItems)
          .where(inArray(orderItems.productId, ids))
          .all()
        const protectedIds = new Set(withOrders.map(o => o.id))
        const cleanable = ids.filter(id => !protectedIds.has(id))

        if (cleanable.length > 0) {
          db.delete(cartItems).where(inArray(cartItems.productId, cleanable)).run()
          db.delete(designs).where(inArray(designs.productId, cleanable)).run()
          db.delete(products).where(inArray(products.id, cleanable)).run()
          console.log(`[lazyClean] hard-deleted ${cleanable.length} trashed products (older than ${days} days); ${protectedIds.size} retained due to order history`)
        }
      }
    }

    const staleThreshold = new Date(Date.now() - 24 * 3600000).toISOString()
    db.delete(userOnline)
      .where(lt(userOnline.lastActiveAt, staleThreshold))
      .run()

    // Prune activity_events so the analytics table stays bounded. Default
    // 30 days; tunable via the `activity_events_retention_days` setting.
    const [evtRow] = db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'activity_events_retention_days')).limit(1).all()
    const evtDays = evtRow ? parseInt(evtRow.value) : 30
    if (Number.isFinite(evtDays) && evtDays > 0) {
      const evtThreshold = new Date(Date.now() - evtDays * 86400000).toISOString()
      db.delete(activityEvents)
        .where(lt(activityEvents.createdAt, evtThreshold))
        .run()
    }
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
    // Only scan recent upload rows — old orphans were already cleaned in
    // prior sweeps, and scanning the full table grows linearly with total
    // upload history.
    const recentThreshold = new Date(Date.now() - 7 * 86400000).toISOString()
    const dbRows = db
      .select({
        thumb: uploads.thumbPath,
        small: uploads.smallPath,
        medium: uploads.mediumPath,
        large: uploads.largePath
      })
      .from(uploads)
      .where(gte(uploads.createdAt, recentThreshold))
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
