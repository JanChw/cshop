import { db } from '../db'
import { activityEvents, dailyStats, productDailyViews, activityEventRefs } from '../db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

// Recompute the pre-aggregate rows for a single day (date is 'YYYY-MM-DD').
// Idempotent: deletes the day's existing rows first, then inserts fresh
// ones. Called periodically (startRollupTimer) for "today" and the previous
// day, so analytics reads a handful of preagg rows instead of scanning
// activity_events.
export function rollupDaily(date: string): void {
  // SQLite stores createdAt as 'YYYY-MM-DD HH:MM:SS' (via datetime('now')).
  // Compare against the same shape — an ISO 'T' separator would sort *after*
  // a space and silently exclude every row of the day.
  const dayStart = `${date} 00:00:00`
  const dayEnd = `${date} 23:59:59`

  const [stats] = db.select({
    pv: sql<number>`COUNT(*)`,
    dau: sql<number>`COUNT(DISTINCT ${activityEvents.userId})`,
    productViews: sql<number>`SUM(CASE WHEN ${activityEvents.eventType}='product_view' THEN 1 ELSE 0 END)`,
    cartAdds: sql<number>`SUM(CASE WHEN ${activityEvents.eventType}='cart_add' THEN 1 ELSE 0 END)`,
    orderCreates: sql<number>`SUM(CASE WHEN ${activityEvents.eventType}='order_create' THEN 1 ELSE 0 END)`
  })
    .from(activityEvents)
    .where(and(gte(activityEvents.createdAt, dayStart), lte(activityEvents.createdAt, dayEnd)))
    .all()

  db.insert(dailyStats).values({
    date,
    pv: stats?.pv ?? 0,
    dau: stats?.dau ?? 0,
    productViews: stats?.productViews ?? 0,
    cartAdds: stats?.cartAdds ?? 0,
    orderCreates: stats?.orderCreates ?? 0
  })
    .onConflictDoUpdate({
      target: dailyStats.date,
      set: {
        pv: sql`excluded.pv`,
        dau: sql`excluded.dau`,
        productViews: sql`excluded.product_views`,
        cartAdds: sql`excluded.cart_adds`,
        orderCreates: sql`excluded.order_creates`
      }
    })
    .run()

  // Per-product views for the day, via the indexed refs table (no JSON_EXTRACT).
  db.delete(productDailyViews).where(eq(productDailyViews.date, date)).run()
  const viewRows = db.select({
    productId: activityEventRefs.productId,
    views: sql<number>`COUNT(*)`
  })
    .from(activityEventRefs)
    .innerJoin(activityEvents, eq(activityEventRefs.eventId, activityEvents.id))
    .where(and(
      eq(activityEvents.eventType, 'product_view'),
      gte(activityEvents.createdAt, dayStart),
      lte(activityEvents.createdAt, dayEnd)
    ))
    .groupBy(activityEventRefs.productId)
    .all()
    .filter(r => r.productId !== null)

  if (viewRows.length > 0) {
    db.insert(productDailyViews).values(
      viewRows.map(r => ({ productId: r.productId!, date, views: r.views }))
    ).run()
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
function yesterdayStr(): string {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

let rollupTimer: ReturnType<typeof setInterval> | null = null

// Roll up today (partial, keeps the current day fresh) and yesterday
// (finalizes it) every 5 minutes. Acceptable lag per the todo.
export function startRollupTimer(): void {
  if (rollupTimer) return
  rollupDaily(todayStr())
  rollupDaily(yesterdayStr())
  rollupTimer = setInterval(() => {
    try { rollupDaily(todayStr()); rollupDaily(yesterdayStr()) } catch (err) { console.error('[rollup] error:', err) }
  }, 5 * 60_000)
  if (rollupTimer && typeof rollupTimer === 'object' && 'unref' in rollupTimer) {
    rollupTimer.unref()
  }
}
