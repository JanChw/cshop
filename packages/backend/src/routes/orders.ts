import { Hono } from 'hono'
import { db } from '../db'
import { orders, orderItems, cartItems, products, productVariants } from '../db/schema'
import { eq, and, desc, inArray, isNull, sql } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { orderSchema } from '../validators'
import { validateJson } from '../utils/validate'
import { trackBusinessEvent } from '../utils/track'
import { sendNotification } from '../utils/notify'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

app.get('/', async (c) => {
  const userId = c.get('userId')!
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const status = c.req.query('status')
  const offset = (page - 1) * limit

  const conditions = [eq(orders.userId, userId)]
  if (status && ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'].includes(status)) {
    conditions.push(eq(orders.status, status as 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'))
  }
  const where = and(...conditions)

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ n: sql<number>`count(*)` }).from(orders).where(where)
  ])

  return success(c, { items, total, page, limit })
})

app.post('/', validateJson(orderSchema), async (c) => {
  const userId = c.get('userId')!
  const { address } = c.req.valid('json')

  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId))
  if (items.length === 0) {
    return fail(c, '购物车为空')
  }

  // Batch-fetch all referenced products and variants in two queries (vs N+1).
  const productIds = Array.from(new Set(items.map(i => i.productId)))
  const variantIds = Array.from(
    new Set(items.map(i => i.variantId).filter((v): v is number => v !== null))
  )

  const productList = await db.select().from(products).where(and(inArray(products.id, productIds), isNull(products.deletedAt)))
  const variantList = variantIds.length > 0
    ? await db.select().from(productVariants).where(inArray(productVariants.id, variantIds))
    : []

  const productMap = new Map(productList.map(p => [p.id, p]))
  const variantMap = new Map(variantList.map(v => [v.id, v]))

  // Pre-compute order line data and validate availability before any writes.
  const lines: Array<{
    productId: number
    designId: number | null
    variantId: number | null
    quantity: number
    price: number
  }> = []
  let total = 0

  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product || !product.isActive) {
      return fail(c, `商品 "${product?.name ?? `#${item.productId}`}" 已下架`)
    }

    let price = product.basePrice
    let availableStock = product.stock

    if (item.variantId !== null) {
      const variant = variantMap.get(item.variantId)
      if (!variant) {
        return fail(c, `规格 #${item.variantId} 不存在`)
      }
      if (variant.productId !== product.id) {
        return fail(c, `规格 #${item.variantId} 不属于商品 "${product.name}"`)
      }
      price += variant.priceAdjustment
      availableStock = variant.stock
    }

    if (availableStock < item.quantity) {
      return fail(c, `商品 "${product.name}" 库存不足`)
    }

    const linePrice = Math.round(price * 100) / 100
    lines.push({
      productId: item.productId,
      designId: item.designId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: linePrice
    })
    total += linePrice * item.quantity
  }

  // Atomic write: create order, items, decrement stock, clear cart.
  // bun-sqlite drizzle transactions are sync; throwing rolls back.
  const orderTotal = Math.round(total * 100) / 100
  const order = db.transaction((tx) => {
    const [created] = tx
      .insert(orders)
      .values({ userId, address, total: orderTotal, status: 'pending' })
      .returning()
      .all()

    for (const line of lines) {
      tx.insert(orderItems).values({ orderId: created.id, ...line }).run()

      if (line.variantId !== null) {
        tx.update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${line.quantity}` })
          .where(eq(productVariants.id, line.variantId))
          .run()
      } else {
        tx.update(products)
          .set({ stock: sql`${products.stock} - ${line.quantity}` })
          .where(eq(products.id, line.productId))
          .run()
      }
    }

    tx.delete(cartItems).where(eq(cartItems.userId, userId)).run()

    return created
  })

  trackBusinessEvent({
    c,
    userId,
    eventType: 'order_create',
    metadata: { orderId: order.id, total: order.total }
  })

  // 通知: 新订单
  sendNotification(
    'new_order',
    `新订单 #${order.id}`,
    `订单号 ORD-${String(order.id).padStart(5, '0')}，金额 ¥${order.total}，收货地址 ${address}`
  )

  // 通知: 库存预警（订单扣减后检查每个变体/商品的剩余库存）
  const STOCK_ALERT_THRESHOLD = 5
  const lowStockIds: string[] = []
  for (const line of lines) {
    if (line.variantId !== null) {
      const [v] = db.select({ stock: productVariants.stock, size: productVariants.size, color: productVariants.color, productId: productVariants.productId })
        .from(productVariants).where(eq(productVariants.id, line.variantId)).limit(1).all()
      if (v && v.stock <= STOCK_ALERT_THRESHOLD) {
        lowStockIds.push(`变体 #${v.productId} ${v.size}/${v.color} 库存剩 ${v.stock}`)
      }
    } else {
      const [p] = db.select({ stock: products.stock, name: products.name })
        .from(products).where(eq(products.id, line.productId)).limit(1).all()
      if (p && p.stock <= STOCK_ALERT_THRESHOLD) {
        lowStockIds.push(`商品 #${p.name} 库存剩 ${p.stock}`)
      }
    }
  }
  if (lowStockIds.length > 0) {
    sendNotification('stock_alert', '库存预警', lowStockIds.join('；'))
  }

  return success(c, order, 201)
})

app.get('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1)

  if (!order) {
    return fail(c, '订单不存在', 404)
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
  return success(c, { ...order, items })
})

app.post('/:id/cancel', async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1)

  if (!order) {
    return fail(c, '订单不存在', 404)
  }

  if (order.status !== 'pending') {
    return fail(c, '只有待支付订单可取消', 400)
  }

  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, id))

  db.transaction((tx) => {
    tx.update(orders)
      .set({ status: 'cancelled', cancelledAt: new Date().toISOString() })
      .where(eq(orders.id, id))
      .run()

    for (const line of lines) {
      if (line.variantId !== null) {
        tx.update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${line.quantity}` })
          .where(eq(productVariants.id, line.variantId))
          .run()
      } else {
        tx.update(products)
          .set({ stock: sql`${products.stock} + ${line.quantity}` })
          .where(eq(products.id, line.productId))
          .run()
      }
    }
  })

  trackBusinessEvent({
    c,
    userId,
    eventType: 'order_cancel',
    metadata: { orderId: id }
  })

  return success(c, { id, status: 'cancelled' })
})

export default app
