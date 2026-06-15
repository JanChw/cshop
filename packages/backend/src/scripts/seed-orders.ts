import { Database } from 'bun:sqlite'
import { resolve } from 'path'

const db = new Database(resolve(import.meta.dir, '../../data/cshop.db'), { strict: true })
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

const addresses = [
  '北京市朝阳区建国路 88 号 SOHO 现代城 12 栋 1801 室',
  '上海市浦东新区世纪大道 100 号 35 楼',
  '广东省深圳市南山区科技园南区高新南一道 9 号',
  '广东省广州市天河区珠江新城花城大道 85 号',
  '浙江省杭州市西湖区文三路 478 号',
  '四川省成都市锦江区春熙路 88 号',
  '江苏省南京市鼓楼区中山路 200 号',
  '湖北省武汉市江汉区解放大道 690 号',
  '陕西省西安市雁塔区高新路 33 号',
  '重庆市渝中区解放碑民权路 28 号',
  '北京市海淀区中关村大街 27 号',
  '上海市静安区南京西路 1601 号',
  '广东省深圳市福田区中心四路嘉里中心 23 楼',
  '天津市和平区南京路 219 号',
  '山东省青岛市市南区香港中路 76 号',
  '辽宁省沈阳市和平区南京北街 206 号',
  '湖南省长沙市岳麓区金星中路 319 号',
  '福建省厦门市思明区莲前西路 2 号',
  '江苏省苏州市工业园区苏州大道东 168 号',
  '浙江省宁波市鄞州区中山东路 1083 号',
]

const trackingCompanies = [
  { prefix: 'SF', name: '顺丰' },
  { prefix: 'YT', name: '圆通' },
  { prefix: 'ZTO', name: '中通' },
  { prefix: 'JD', name: '京东' },
  { prefix: 'EMS', name: '邮政' },
]

function trackingNo(prefix: string): string {
  const digits = Math.floor(10_000_000_000 + Math.random() * 89_999_999_999)
  return `${prefix}${digits}CN`
}

function offsetDate(daysAgo: number, hourOffset = 0): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(d.getUTCHours() + hourOffset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

interface SeedItem {
  productId: number
  variantId: number | null
  quantity: number
  price: number
}

interface SeedOrder {
  userId: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  daysAgo: number
  items: SeedItem[]
  address: string
}

const userIds = [1, 2, 3, 4, 9, 10]

const productPicks: Array<{ productId: number; variantId: number | null; price: number }> = [
  { productId: 1, variantId: 1, price: 99 },
  { productId: 1, variantId: 6, price: 99 },
  { productId: 2, variantId: 9, price: 299 },
  { productId: 2, variantId: 12, price: 299 },
  { productId: 3, variantId: 15, price: 249 },
  { productId: 3, variantId: 18, price: 249 },
  { productId: 4, variantId: 21, price: 149 },
  { productId: 4, variantId: 24, price: 149 },
  { productId: 6, variantId: 33, price: 199 },
  { productId: 6, variantId: 36, price: 199 },
  { productId: 7, variantId: 39, price: 129 },
  { productId: 7, variantId: 42, price: 129 },
  { productId: 18, variantId: null, price: 99 },
  { productId: 21, variantId: null, price: 10 },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

function buildOrders(): SeedOrder[] {
  const orders: SeedOrder[] = []

  const statusPlan: Array<{ status: SeedOrder['status']; count: number; daysRange: [number, number] }> = [
    { status: 'pending', count: 6, daysRange: [0, 2] },
    { status: 'paid', count: 5, daysRange: [1, 4] },
    { status: 'processing', count: 5, daysRange: [2, 6] },
    { status: 'shipped', count: 6, daysRange: [3, 10] },
    { status: 'completed', count: 7, daysRange: [8, 30] },
    { status: 'cancelled', count: 3, daysRange: [5, 20] },
  ]

  for (const { status, count, daysRange } of statusPlan) {
    for (let i = 0; i < count; i++) {
      const userId = pick(userIds)
      const itemCount = Math.random() < 0.35 ? 1 : Math.random() < 0.7 ? 2 : 3
      const picks = pickN(productPicks, itemCount)
      const items: SeedItem[] = picks.map((p) => ({
        productId: p.productId,
        variantId: p.variantId,
        quantity: Math.floor(1 + Math.random() * 3),
        price: p.price,
      }))
      const daysAgo = daysRange[0] + Math.floor(Math.random() * (daysRange[1] - daysRange[0] + 1))
      orders.push({
        userId,
        status,
        daysAgo,
        items,
        address: pick(addresses),
      })
    }
  }

  return orders
}

const orders = buildOrders()

let created = 0
db.transaction(() => {
  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, status, total, address, paid_at, shipped_at, completed_at, cancelled_at, tracking_no, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, design_id, variant_id, quantity, price)
    VALUES (?, ?, NULL, ?, ?, ?)
  `)

  for (const o of orders) {
    const total = o.items.reduce((s, it) => s + it.price * it.quantity, 0)
    const createdAt = offsetDate(o.daysAgo, Math.floor(Math.random() * 12 - 6))
    const updatedAt = createdAt

    let paidAt: string | null = null
    let shippedAt: string | null = null
    let completedAt: string | null = null
    let cancelledAt: string | null = null
    let trackingNoVal: string | null = null

    let cursor = o.daysAgo

    if (['paid', 'processing', 'shipped', 'completed'].includes(o.status)) {
      const paidDay = Math.max(0, cursor - 1)
      paidAt = offsetDate(paidDay, Math.floor(Math.random() * 6 + 1))
      cursor = paidDay
    }
    if (['shipped', 'completed'].includes(o.status)) {
      const shipDay = Math.max(0, cursor - 1)
      shippedAt = offsetDate(shipDay, Math.floor(Math.random() * 6 + 6))
      cursor = shipDay
      const tk = pick(trackingCompanies)
      trackingNoVal = trackingNo(tk.prefix)
    }
    if (o.status === 'completed') {
      const completeDay = Math.max(0, cursor - 5)
      completedAt = offsetDate(completeDay, Math.floor(Math.random() * 12 + 6))
    }
    if (o.status === 'cancelled') {
      cancelledAt = offsetDate(Math.max(0, cursor - 1), Math.floor(Math.random() * 6 + 1))
    }

    const result = insertOrder.run(
      o.userId,
      o.status,
      total,
      o.address,
      paidAt,
      shippedAt,
      completedAt,
      cancelledAt,
      trackingNoVal,
      createdAt,
      updatedAt,
    )
    const orderId = Number(result.lastInsertRowid)

    for (const it of o.items) {
      insertItem.run(orderId, it.productId, it.variantId, it.quantity, it.price)
    }
    created++
  }
})()

const byStatus = db
  .query<{ status: string; n: number }, []>(
    `SELECT status, COUNT(*) AS n FROM orders GROUP BY status ORDER BY status`
  )
  .all()

const byUser = db
  .query<{ user_id: number; n: number; total: number }, []>(
    `SELECT user_id, COUNT(*) AS n, ROUND(SUM(total), 2) AS total FROM orders GROUP BY user_id ORDER BY user_id`
  )
  .all()

const grandTotal = db.query<{ n: number; total: number; avg: number }, []>(
  `SELECT COUNT(*) AS n, ROUND(SUM(total), 2) AS total, ROUND(AVG(total), 2) AS avg FROM orders`
).get()

console.log(`Created ${created} orders.`)
console.log('\n=== orders by status ===')
for (const r of byStatus) console.log(`  ${r.status.padEnd(12)} ${r.n}`)
console.log('\n=== orders by user ===')
for (const r of byUser) console.log(`  user ${r.user_id}: ${r.n} orders, ¥${r.total}`)
console.log(`\n=== grand total: ${grandTotal?.n} orders, ¥${grandTotal?.total}, avg ¥${grandTotal?.avg} ===`)

db.close()
