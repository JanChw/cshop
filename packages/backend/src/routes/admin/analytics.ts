import { Hono } from 'hono'
import { db } from '../../db'
import { activityEvents, userOnline, users, dailyStats, productDailyViews, activityEventRefs } from '../../db/schema'
import { eq, and, gte, lte, desc, count, sql, inArray, sum } from 'drizzle-orm'
import { success } from '../../utils/response'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

function periodToFrom(period: string): string {
  // Return 'YYYY-MM-DD HH:MM:SS' to match SQLite's datetime('now') storage
  // shape — an ISO 'T' separator sorts after a space and would exclude
  // every row of the window in a string comparison.
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  switch (period) {
    case '7d': now.setTime(now.getTime() - 7 * 86400000); break
    case '30d': now.setTime(now.getTime() - 30 * 86400000); break
    default: break
  }
  return now.toISOString().slice(0, 10) + ' 00:00:00'
}

app.get('/online', requirePermission('analytics.read'), async (c) => {
  const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const rows = db
    .select({
      userId: userOnline.userId,
      deviceType: userOnline.deviceType,
      loginAt: userOnline.loginAt,
      lastActiveAt: userOnline.lastActiveAt,
      ip: userOnline.ip,
      country: userOnline.country,
      region: userOnline.region,
      city: userOnline.city
    })
    .from(userOnline)
    .where(gte(userOnline.lastActiveAt, threshold))
    .all()

  if (rows.length === 0) {
    return success(c, { total: 0, users: [] })
  }

  const userIds = Array.from(new Set(rows.map(r => r.userId)))
  const userList = db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, userIds))
    .all()

  const userMap = new Map(userList.map(u => [u.id, u]))

  const withNames = rows.map(r => {
    const user = userMap.get(r.userId)
    return { ...r, name: user?.name, email: user?.email }
  })

  return success(c, { total: withNames.length, users: withNames })
})

app.get('/events', requirePermission('analytics.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const eventType = c.req.query('type')
  const userIdStr = c.req.query('userId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const deviceType = c.req.query('deviceType')
  const country = c.req.query('country')

  const conditions = []
  if (eventType) conditions.push(eq(activityEvents.eventType, eventType))
  if (userIdStr) {
    const uid = parseInt(userIdStr)
    if (Number.isFinite(uid)) conditions.push(eq(activityEvents.userId, uid))
  }
  if (from) conditions.push(gte(activityEvents.createdAt, from))
  if (to) conditions.push(lte(activityEvents.createdAt, to))
  if (deviceType) conditions.push(eq(activityEvents.deviceType, deviceType))
  if (country) conditions.push(eq(activityEvents.country, country))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [{ n: total }]] = await Promise.all([
    db.select({
      id: activityEvents.id,
      userId: activityEvents.userId,
      eventType: activityEvents.eventType,
      path: activityEvents.path,
      method: activityEvents.method,
      statusCode: activityEvents.statusCode,
      duration: activityEvents.duration,
      ip: activityEvents.ip,
      deviceType: activityEvents.deviceType,
      country: activityEvents.country,
      region: activityEvents.region,
      city: activityEvents.city,
      createdAt: activityEvents.createdAt
    }).from(activityEvents).where(where).orderBy(desc(activityEvents.createdAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(activityEvents).where(where)
  ])

  return success(c, { items, total, page, limit })
})

app.get('/summary', requirePermission('analytics.read'), async (c) => {
  const period = c.req.query('period') ?? 'today'
  const fromISO = periodToFrom(period)
  const fromDate = fromISO.slice(0, 10)
  const todayDate = new Date().toISOString().slice(0, 10)

  // Scalars (pv + funnel) are additive, so summing daily_stats over the
  // range is exact and reads only a handful of rows. dau is NOT additive
  // across days (a user active 3 days counts once), so it stays a single
  // distinct-count over the windowed partition.
  const [agg] = db.select({
    pv: sum(dailyStats.pv),
    productViews: sum(dailyStats.productViews),
    cartAdds: sum(dailyStats.cartAdds),
    orderCreates: sum(dailyStats.orderCreates)
  })
    .from(dailyStats)
    .where(and(gte(dailyStats.date, fromDate), lte(dailyStats.date, todayDate)))
    .all()

  const [dauRow] = db.select({
    dau: sql<number>`COUNT(DISTINCT ${activityEvents.userId})`
  })
    .from(activityEvents)
    .where(gte(activityEvents.createdAt, fromISO))
    .all()

  // topProducts: SUM views per product from product_daily_views (indexed
  // range scan + group by), joined to refs for the product name.
  const topProducts = db.select({
    productId: productDailyViews.productId,
    productName: sql<string | null>`MAX(${activityEventRefs.productName})`,
    views: sql<number>`CAST(COALESCE(SUM(${productDailyViews.views}), 0) AS INTEGER)`
  })
    .from(productDailyViews)
    .leftJoin(activityEventRefs, eq(activityEventRefs.productId, productDailyViews.productId))
    .where(and(gte(productDailyViews.date, fromDate), lte(productDailyViews.date, todayDate)))
    .groupBy(productDailyViews.productId)
    .orderBy(desc(sql`SUM(${productDailyViews.views})`))
    .limit(10)
    .all()

  // deviceDistribution isn't pre-aggregated (only ~4 groups, cheap); keep
  // the grouped scan over the windowed partition.
  const deviceDistribution = db
    .select({
      deviceType: activityEvents.deviceType,
      count: count()
    })
    .from(activityEvents)
    .where(gte(activityEvents.createdAt, fromISO))
    .groupBy(activityEvents.deviceType)
    .orderBy(desc(count()))
    .all()

  const trendDays = period === 'today' ? 7 : (period === '7d' ? 7 : 30)
  const trendFromDate = new Date(Date.now() - (trendDays - 1) * 86400000).toISOString().slice(0, 10)
  const trend = db
    .select({
      date: dailyStats.date,
      pv: dailyStats.pv,
      dau: dailyStats.dau
    })
    .from(dailyStats)
    .where(gte(dailyStats.date, trendFromDate))
    .orderBy(dailyStats.date)
    .all()

  return success(c, {
    dau: dauRow?.dau ?? 0,
    pv: Number(agg?.pv ?? 0),
    topProducts,
    funnel: {
      productView: Number(agg?.productViews ?? 0),
      cartAdd: Number(agg?.cartAdds ?? 0),
      orderCreate: Number(agg?.orderCreates ?? 0)
    },
    deviceDistribution,
    trend
  })
})

app.get('/geo', requirePermission('analytics.read'), async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  const conditions = [sql`${activityEvents.country} IS NOT NULL`]
  if (from) conditions.push(gte(activityEvents.createdAt, from))
  if (to) conditions.push(lte(activityEvents.createdAt, to))

  const byCountry = db
    .select({
      country: activityEvents.country,
      count: count()
    })
    .from(activityEvents)
    .where(and(...conditions))
    .groupBy(activityEvents.country)
    .orderBy(desc(count()))
    .limit(20)
    .all()

  const byRegion = db
    .select({
      country: activityEvents.country,
      region: activityEvents.region,
      count: count()
    })
    .from(activityEvents)
    .where(and(...conditions, sql`${activityEvents.region} IS NOT NULL`))
    .groupBy(activityEvents.country, activityEvents.region)
    .orderBy(desc(count()))
    .limit(50)
    .all()

  const byCity = db
    .select({
      country: activityEvents.country,
      region: activityEvents.region,
      city: activityEvents.city,
      count: count()
    })
    .from(activityEvents)
    .where(and(...conditions, sql`${activityEvents.city} IS NOT NULL`))
    .groupBy(activityEvents.country, activityEvents.region, activityEvents.city)
    .orderBy(desc(count()))
    .limit(100)
    .all()

  return success(c, { byCountry, byRegion, byCity })
})

app.get('/audit', requirePermission('analytics.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const from = c.req.query('from')
  const to = c.req.query('to')

  const conditions = [eq(activityEvents.eventType, 'admin_action')]
  if (from) conditions.push(gte(activityEvents.createdAt, from))
  if (to) conditions.push(lte(activityEvents.createdAt, to))

  const where = and(...conditions)

  const [items, [{ n: total }]] = await Promise.all([
    db.select({
      id: activityEvents.id,
      userId: activityEvents.userId,
      eventType: activityEvents.eventType,
      path: activityEvents.path,
      method: activityEvents.method,
      statusCode: activityEvents.statusCode,
      duration: activityEvents.duration,
      ip: activityEvents.ip,
      deviceType: activityEvents.deviceType,
      country: activityEvents.country,
      region: activityEvents.region,
      city: activityEvents.city,
      createdAt: activityEvents.createdAt
    }).from(activityEvents).where(where).orderBy(desc(activityEvents.createdAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(activityEvents).where(where)
  ])

  const userIds = Array.from(new Set(items.filter(e => e.userId !== null).map(e => e.userId!)))
  const userMap = new Map<number, { name: string; email: string }>()
  if (userIds.length > 0) {
    const userList = db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds)).all()
    for (const u of userList) userMap.set(u.id, { name: u.name, email: u.email })
  }

  const itemsWithUser = items.map(e => ({
    ...e,
    userName: e.userId ? userMap.get(e.userId)?.name ?? null : null,
    userEmail: e.userId ? userMap.get(e.userId)?.email ?? null : null
  }))

  return success(c, { items: itemsWithUser, total, page, limit })
})

app.get('/retention', requirePermission('analytics.read'), async (c) => {
  const cohortDate = c.req.query('cohortDate')
  if (!cohortDate) {
    return success(c, { cohort: null, retention: [] })
  }

  const cohortStart = new Date(cohortDate)
  cohortStart.setHours(0, 0, 0, 0)
  const cohortEnd = new Date(cohortStart.getTime() + 86400000)

  const cohortUsers = db
    .selectDistinct({ userId: activityEvents.userId })
    .from(activityEvents)
    .where(and(
      gte(activityEvents.createdAt, cohortStart.toISOString()),
      lte(activityEvents.createdAt, cohortEnd.toISOString()),
      sql`${activityEvents.userId} IS NOT NULL`
    ))
    .all()

  const cohortSize = cohortUsers.length
  if (cohortSize === 0) {
    return success(c, { cohort: { date: cohortDate, size: 0 }, retention: [] })
  }

  const userIds = cohortUsers.map(u => u.userId).filter((id): id is number => id !== null)
  const retention: Array<{ day: number; count: number; rate: number }> = []

  // Single query: GROUP BY DATE(createdAt) over the 8-day window, counting
  // distinct users per day. Replaces 8 separate selectDistinct queries.
  const windowEnd = new Date(cohortStart.getTime() + 8 * 86400000)
  const dayRows = db
    .select({
      day: sql<string>`DATE(${activityEvents.createdAt})`,
      n: sql<number>`COUNT(DISTINCT ${activityEvents.userId})`
    })
    .from(activityEvents)
    .where(and(
      inArray(activityEvents.userId, userIds),
      gte(activityEvents.createdAt, cohortStart.toISOString()),
      lte(activityEvents.createdAt, windowEnd.toISOString())
    ))
    .groupBy(sql`DATE(${activityEvents.createdAt})`)
    .all()

  const dayMap = new Map<string, number>()
  for (const r of dayRows) dayMap.set(r.day, r.n)

  const cohortDateStr = cohortStart.toISOString().slice(0, 10)
  for (let day = 0; day <= 7; day++) {
    const dayDate = new Date(cohortStart.getTime() + day * 86400000)
    const dayStr = dayDate.toISOString().slice(0, 10)
    const count = dayMap.get(dayStr) ?? 0
    retention.push({
      day,
      count,
      rate: Math.round((count / cohortSize) * 10000) / 100
    })
  }

  return success(c, {
    cohort: { date: cohortDate, size: cohortSize },
    retention
  })
})

app.get('/export', requirePermission('analytics.export'), async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  const eventType = c.req.query('eventType')

  const conditions = []
  if (from) conditions.push(gte(activityEvents.createdAt, from))
  if (to) conditions.push(lte(activityEvents.createdAt, to))
  if (eventType) conditions.push(eq(activityEvents.eventType, eventType))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = db
    .select()
    .from(activityEvents)
    .where(where)
    .orderBy(desc(activityEvents.createdAt))
    .limit(10000)
    .all()

  const header = 'id,userId,eventType,path,method,statusCode,duration,ip,userAgent,deviceType,country,region,city,metadata,createdAt'
  const lines = rows.map(r => {
    const fields = [
      r.id, r.userId ?? '', r.eventType, r.path ?? '',
      r.method ?? '', r.statusCode ?? '', r.duration ?? '',
      r.ip ?? '', `"${(r.userAgent ?? '').replace(/"/g, '""')}"`,
      r.deviceType, r.country ?? '', r.region ?? '', r.city ?? '',
      `"${(r.metadata ?? '').replace(/"/g, '""')}"`,
      r.createdAt
    ]
    return fields.join(',')
  })

  const csv = [header, ...lines].join('\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="analytics-export-${Date.now()}.csv"`,
      'Cache-Control': 'no-store'
    }
  })
})

export default app
