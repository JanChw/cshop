import { Hono } from 'hono'
import { db } from '../../db'
import { activityEvents, userOnline, users } from '../../db/schema'
import { eq, and, gte, lte, desc, count, sql, inArray } from 'drizzle-orm'
import { success } from '../../utils/response'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

function periodToFrom(period: string): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  switch (period) {
    case '7d': return new Date(now.getTime() - 7 * 86400000).toISOString()
    case '30d': return new Date(now.getTime() - 30 * 86400000).toISOString()
    default: return now.toISOString()
  }
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
    db.select().from(activityEvents).where(where).orderBy(desc(activityEvents.createdAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(activityEvents).where(where)
  ])

  return success(c, { items, total, page, limit })
})

app.get('/summary', requirePermission('analytics.read'), async (c) => {
  const period = c.req.query('period') ?? 'today'
  const fromISO = periodToFrom(period)

  const [dauRow] = db
    .select({ n: sql<number>`COUNT(DISTINCT ${activityEvents.userId})` })
    .from(activityEvents)
    .where(and(
      gte(activityEvents.createdAt, fromISO),
      sql`${activityEvents.userId} IS NOT NULL`
    ))
    .all()

  const [pvRow] = db
    .select({ n: count() })
    .from(activityEvents)
    .where(gte(activityEvents.createdAt, fromISO))
    .all()

  const topProducts = db
    .select({
      productId: sql<number>`JSON_EXTRACT(${activityEvents.metadata}, '$.productId')`,
      productName: sql<string>`JSON_EXTRACT(${activityEvents.metadata}, '$.productName')`,
      views: count()
    })
    .from(activityEvents)
    .where(and(
      eq(activityEvents.eventType, 'product_view'),
      gte(activityEvents.createdAt, fromISO)
    ))
    .groupBy(sql`JSON_EXTRACT(${activityEvents.metadata}, '$.productId')`)
    .orderBy(desc(count()))
    .limit(10)
    .all()

  const [viewCount] = db
    .select({ n: count() })
    .from(activityEvents)
    .where(and(eq(activityEvents.eventType, 'product_view'), gte(activityEvents.createdAt, fromISO)))
    .all()

  const [cartCount] = db
    .select({ n: count() })
    .from(activityEvents)
    .where(and(eq(activityEvents.eventType, 'cart_add'), gte(activityEvents.createdAt, fromISO)))
    .all()

  const [orderCount] = db
    .select({ n: count() })
    .from(activityEvents)
    .where(and(eq(activityEvents.eventType, 'order_create'), gte(activityEvents.createdAt, fromISO)))
    .all()

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
  const trend = db
    .select({
      date: sql<string>`DATE(${activityEvents.createdAt})`,
      pv: count(),
      dau: sql<number>`COUNT(DISTINCT ${activityEvents.userId})`
    })
    .from(activityEvents)
    .where(gte(activityEvents.createdAt, new Date(Date.now() - trendDays * 86400000).toISOString()))
    .groupBy(sql`DATE(${activityEvents.createdAt})`)
    .orderBy(sql`DATE(${activityEvents.createdAt})`)
    .all()

  return success(c, {
    dau: dauRow?.n ?? 0,
    pv: pvRow?.n ?? 0,
    topProducts,
    funnel: {
      productView: viewCount?.n ?? 0,
      cartAdd: cartCount?.n ?? 0,
      orderCreate: orderCount?.n ?? 0
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
    db.select().from(activityEvents).where(where).orderBy(desc(activityEvents.createdAt)).limit(limit).offset(offset),
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

  for (let day = 0; day <= 7; day++) {
    const dayStart = new Date(cohortStart.getTime() + day * 86400000)
    const dayEnd = new Date(dayStart.getTime() + 86400000)

    const returned = db
      .selectDistinct({ userId: activityEvents.userId })
      .from(activityEvents)
      .where(and(
        inArray(activityEvents.userId, userIds),
        gte(activityEvents.createdAt, dayStart.toISOString()),
        lte(activityEvents.createdAt, dayEnd.toISOString())
      ))
      .all()

    retention.push({
      day,
      count: returned.length,
      rate: Math.round((returned.length / cohortSize) * 10000) / 100
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
