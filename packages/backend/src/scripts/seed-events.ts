import { Database } from 'bun:sqlite'
import { resolve } from 'path'

const db = new Database(resolve(import.meta.dir, '../../data/cshop.db'), { strict: true })
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

let seed = 12345
function rand(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function pickWeighted<T>(items: Array<[T, number]>): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [v, w] of items) {
    r -= w
    if (r <= 0) return v
  }
  return items[items.length - 1][0]
}
function randInt(min: number, max: number): number {
  return Math.floor(min + rand() * (max - min + 1))
}

const users = db
  .query<{ id: number; name: string }, []>('SELECT id, name FROM users WHERE status = ? OR status IS NULL ORDER BY id')
  .all('active')
const userIds = users.map(u => u.id)
const userNames = new Map(users.map(u => [u.id, u.name]))

const products = db
  .query<{ id: number; name: string; base_price: number }, []>(
    'SELECT id, name, base_price FROM products WHERE deleted_at IS NULL AND is_active = 1 ORDER BY id'
  )
  .all()
const productList = products.map(p => ({ id: p.id, name: p.name, price: p.base_price }))

const productWeights: Array<[{ id: number; name: string; price: number }, number]> = [
  [{ id: 1, name: '经典圆领T恤', price: 99 }, 40],
  [{ id: 2, name: '潮流连帽卫衣', price: 299 }, 18],
  [{ id: 3, name: '修身牛仔裤', price: 249 }, 14],
  [{ id: 4, name: '纯棉 Polo 衫', price: 149 }, 10],
  [{ id: 6, name: '时尚太阳镜', price: 199 }, 8],
  [{ id: 7, name: '真皮腰带', price: 129 }, 5],
  [{ id: 18, name: '卫衣基本款', price: 99 }, 4],
  [{ id: 21, name: 'temp-prod', price: 10 }, 1],
]

const deviceWeights: Array<[string, number]> = [
  ['mobile', 60],
  ['desktop', 30],
  ['tablet', 10],
]

const cities = [
  { country: 'CN', region: '北京', city: '北京' },
  { country: 'CN', region: '上海', city: '上海' },
  { country: 'CN', region: '广东', city: '深圳' },
  { country: 'CN', region: '广东', city: '广州' },
  { country: 'CN', region: '浙江', city: '杭州' },
  { country: 'CN', region: '四川', city: '成都' },
  { country: 'CN', region: '江苏', city: '南京' },
  { country: 'CN', region: '湖北', city: '武汉' },
]

const userAgents: Record<string, string> = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  tablet: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
}

function isoAt(daysAgo: number, hour: number, minute: number, second: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(hour, minute, second, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function hourWeight(hour: number): number {
  if (hour < 8) return 0.3
  if (hour < 12) return 1.4
  if (hour < 14) return 0.9
  if (hour < 19) return 1.6
  if (hour < 23) return 1.0
  return 0.5
}

function dayOfWeekWeight(date: Date): number {
  const dow = date.getUTCDay()
  return dow === 0 || dow === 6 ? 1.4 : 1.0
}

interface EventRow {
  userId: number
  eventType: string
  path: string
  method: string
  statusCode: number
  duration: number
  ip: string
  userAgent: string
  deviceType: string
  country: string
  region: string
  city: string
  metadata: string | null
  createdAt: string
}

function makeProductViewEvent(daysAgo: number, weightedHour: number): EventRow {
  const p = pickWeighted(productWeights)
  const device = pickWeighted(deviceWeights)
  const city = pick(cities)
  const userId = pick(userIds)
  const user = userNames.get(userId) ?? ''
  const minute = randInt(0, 59)
  const second = randInt(0, 59)
  return {
    userId,
    eventType: 'product_view',
    path: `/products/${p.id}`,
    method: 'GET',
    statusCode: 200,
    duration: randInt(20, 380),
    ip: `192.168.${randInt(1, 254)}.${randInt(1, 254)}`,
    userAgent: userAgents[device],
    deviceType: device,
    country: city.country,
    region: city.region,
    city: city.city,
    metadata: JSON.stringify({ productId: p.id, productName: p.name, userName: user }),
    createdAt: isoAt(daysAgo, weightedHour, minute, second),
  }
}

function makeCartAddEvent(daysAgo: number, weightedHour: number): EventRow {
  const p = pickWeighted(productWeights)
  const device = pickWeighted(deviceWeights)
  const city = pick(cities)
  const userId = pick(userIds)
  const minute = randInt(0, 59)
  const second = randInt(0, 59)
  return {
    userId,
    eventType: 'cart_add',
    path: `/api/v1/cart/items`,
    method: 'POST',
    statusCode: 201,
    duration: randInt(30, 180),
    ip: `192.168.${randInt(1, 254)}.${randInt(1, 254)}`,
    userAgent: userAgents[device],
    deviceType: device,
    country: city.country,
    region: city.region,
    city: city.city,
    metadata: JSON.stringify({ productId: p.id, productName: p.name }),
    createdAt: isoAt(daysAgo, weightedHour, minute, second),
  }
}

function makeOrderCreateEvent(daysAgo: number, weightedHour: number): EventRow {
  const p = pickWeighted(productWeights)
  const device = pickWeighted(deviceWeights)
  const city = pick(cities)
  const userId = pick(userIds)
  const minute = randInt(0, 59)
  const second = randInt(0, 59)
  return {
    userId,
    eventType: 'order_create',
    path: `/api/v1/orders`,
    method: 'POST',
    statusCode: 201,
    duration: randInt(120, 540),
    ip: `192.168.${randInt(1, 254)}.${randInt(1, 254)}`,
    userAgent: userAgents[device],
    deviceType: device,
    country: city.country,
    region: city.region,
    city: city.city,
    metadata: JSON.stringify({ productId: p.id, productName: p.name, quantity: randInt(1, 3) }),
    createdAt: isoAt(daysAgo, weightedHour, minute, second),
  }
}

function weightedHour(): number {
  const hours = Array.from({ length: 24 }, (_, h) => h)
  const totalWeight = hours.reduce((s, h) => s + hourWeight(h), 0)
  let r = rand() * totalWeight
  for (const h of hours) {
    r -= hourWeight(h)
    if (r <= 0) return h
  }
  return 12
}

const events: EventRow[] = []

for (let daysAgo = 0; daysAgo <= 30; daysAgo++) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - daysAgo)
  const dowMult = dayOfWeekWeight(date)
  const baseViews = Math.round(300 * dowMult)
  const baseCarts = Math.round(45 * dowMult)
  const baseOrders = Math.round(12 * dowMult)

  const viewCount = baseViews + randInt(-80, 80)
  for (let i = 0; i < viewCount; i++) {
    events.push(makeProductViewEvent(daysAgo, weightedHour()))
  }

  const cartCount = baseCarts + randInt(-15, 15)
  for (let i = 0; i < cartCount; i++) {
    events.push(makeCartAddEvent(daysAgo, weightedHour()))
  }

  const orderCount = baseOrders + randInt(-5, 5)
  for (let i = 0; i < orderCount; i++) {
    events.push(makeOrderCreateEvent(daysAgo, weightedHour()))
  }
}

const cleared = db.query(`DELETE FROM activity_events WHERE event_type IN ('product_view', 'cart_add', 'order_create')`).run().changes

const insert = db.prepare(`
  INSERT INTO activity_events (user_id, event_type, path, method, status_code, duration, ip, user_agent, device_type, country, region, city, metadata, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertMany = db.transaction((rows: EventRow[]) => {
  for (const r of rows) {
    insert.run(
      r.userId, r.eventType, r.path, r.method, r.statusCode, r.duration,
      r.ip, r.userAgent, r.deviceType, r.country, r.region, r.city,
      r.metadata, r.createdAt
    )
  }
})
insertMany(events)

const byType = db
  .query<{ event_type: string; n: number }, []>(`SELECT event_type, COUNT(*) AS n FROM activity_events GROUP BY event_type ORDER BY n DESC`)
  .all()
const byDev = db
  .query<{ device_type: string; n: number }, []>(`SELECT device_type, COUNT(*) AS n FROM activity_events WHERE event_type IN ('product_view','cart_add','order_create') GROUP BY device_type`)
  .all()
const top5 = db
  .query<{ productId: number; productName: string; views: number }, []>(
    `SELECT JSON_EXTRACT(metadata, '$.productId') AS productId,
            JSON_EXTRACT(metadata, '$.productName') AS productName,
            COUNT(*) AS views
     FROM activity_events
     WHERE event_type = 'product_view'
     GROUP BY JSON_EXTRACT(metadata, '$.productId')
     ORDER BY views DESC LIMIT 5`
  )
  .all()
const funnel = db
  .query<{ productView: number; cartAdd: number; orderCreate: number }, []>(
    `SELECT
       (SELECT COUNT(*) FROM activity_events WHERE event_type = 'product_view') AS productView,
       (SELECT COUNT(*) FROM activity_events WHERE event_type = 'cart_add') AS cartAdd,
       (SELECT COUNT(*) FROM activity_events WHERE event_type = 'order_create') AS orderCreate`
  )
  .get()

console.log(`Cleared ${cleared} old seeded events.`)
console.log(`Inserted ${events.length} events.`)
console.log('\n=== event type distribution ===')
for (const r of byType) console.log(`  ${r.event_type.padEnd(15)} ${r.n}`)
console.log('\n=== funnel ===')
if (funnel) console.log(`  productView: ${funnel.productView} → cartAdd: ${funnel.cartAdd} → orderCreate: ${funnel.orderCreate}`)
console.log('\n=== device distribution ===')
for (const r of byDev) console.log(`  ${r.device_type.padEnd(10)} ${r.n}`)
console.log('\n=== top 5 products (by views) ===')
for (const p of top5) console.log(`  id=${p.productId} ${p.productName}: ${p.views} views`)

db.close()
