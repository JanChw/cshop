import { Hono } from 'hono'
import { db } from '../db'
import {
  products, productVariants, orders, orderItems,
  cartItems, designs, users, uploads
} from '../db/schema'
import { eq, desc, count, sum, and, sql } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { productSchema, productVariantSchema, orderStatusSchema } from '../validators'
import { trackBusinessEvent } from '../utils/track'
import { canTransition } from '../utils/orderTransitions'
import { processImage } from '../utils/image'
import { config } from '../config'
import backupRoutes from './admin/backup'
import { adminStickerRoutes } from './stickers'
import { adminCategoryRoutes } from './categories'
import analyticsRoutes from './admin/analytics'
import settingsRoutes from './admin/settings'
import staffRoutes from './admin/staff'
import rolesRoutes from './admin/roles'
import usersRoutes from './admin/users'
import uploadsRoutes from './admin/uploads'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/dashboard', requirePermission('analytics.read'), async (c) => {
  const [productRow] = await db.select({ n: count() }).from(products)
  const [orderRow] = await db.select({ n: count() }).from(orders)
  const [pendingRow] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, 'pending'))
  const [revenueRow] = await db
    .select({ total: sum(orders.total) })
    .from(orders)
    .where(eq(orders.status, 'completed'))

  const totalRevenue = revenueRow?.total ? Number(revenueRow.total) : 0

  return success(c, {
    productCount: productRow?.n ?? 0,
    orderCount: orderRow?.n ?? 0,
    pendingCount: pendingRow?.n ?? 0,
    totalRevenue
  })
})

app.get('/products', requirePermission('product.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const includeInactive = c.req.query('includeInactive') === 'true'

  const where = includeInactive ? undefined : eq(products.isActive, true)
  const baseQuery = db.select().from(products)
  const countQuery = db.select({ n: count() }).from(products)

  const [items, [{ n: total }]] = await Promise.all([
    (where ? baseQuery.where(where) : baseQuery).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
    where ? countQuery.where(where) : countQuery
  ])

  return success(c, { items, total, page, limit })
})

app.get('/products/:id', requirePermission('product.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!product) {
    return fail(c, '商品不存在', 404)
  }
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id))
  return success(c, { ...product, variants })
})

app.post('/products', requirePermission('product.create'), validateJson(productSchema), async (c) => {
  const data = c.req.valid('json')
  const [record] = await db.insert(products).values(data).returning()
  return success(c, record, 201)
})

app.put('/products/:id', requirePermission('product.update'), validateJson(productSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }

  await db.update(products).set(data).where(eq(products.id, id))
  return success(c, null)
})

app.post('/products/:id/image', requirePermission('product.update'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }

  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return fail(c, '请选择文件', 400)
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail(c, '不支持的文件格式，仅支持 jpg/png/webp', 400)
  }
  if (file.size > config.uploadMaxBytes) {
    return fail(c, `文件大小不能超过 ${Math.round(config.uploadMaxBytes / 1024 / 1024)}MB`, 400)
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const tmpPath = `/tmp/cshop-product-img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await Bun.write(tmpPath, file)

  try {
    const variants = await processImage(tmpPath)
    const imageUrl = `/api/v1/uploads/${variants.large.path}`

    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: file.name,
      baseName: variants.baseName,
      mimeType: file.type,
      thumbPath: variants.thumb.path,
      smallPath: variants.small.path,
      mediumPath: variants.medium.path,
      largePath: variants.large.path,
      thumbSize: variants.thumb.size,
      smallSize: variants.small.size,
      mediumSize: variants.medium.size,
      largeSize: variants.large.size,
      width: variants.large.width,
      height: variants.large.height
    })

    await db.update(products).set({ image: imageUrl }).where(eq(products.id, id))
    return success(c, { image: imageUrl })
  } finally {
    const { unlink } = await import('node:fs/promises')
    await unlink(tmpPath).catch(() => {})
  }
})

app.delete('/products/:id', requirePermission('product.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await db.update(products).set({ isActive: false }).where(eq(products.id, id))
  return success(c, null)
})

app.post('/products/:id/restore', requirePermission('product.update'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }
  await db.update(products).set({ isActive: true }).where(eq(products.id, id))
  return success(c, null)
})

app.get('/products/:id/variants', requirePermission('product.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const items = await db.select().from(productVariants).where(eq(productVariants.productId, id))
  return success(c, { items })
})

app.post('/products/:id/variants', requirePermission('product.create'), validateJson(productVariantSchema), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  const [record] = await db.insert(productVariants).values({ ...data, productId }).returning()
  return success(c, record, 201)
})

app.put('/products/:productId/variants/:variantId', requirePermission('product.update'), validateJson(productVariantSchema), async (c) => {
  const variantId = parseInt(c.req.param('variantId'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1)
  if (!existing) {
    return fail(c, '规格不存在', 404)
  }

  await db.update(productVariants).set(data).where(eq(productVariants.id, variantId))
  return success(c, null)
})

app.delete('/products/:productId/variants/:variantId', requirePermission('product.delete'), async (c) => {
  const variantId = parseInt(c.req.param('variantId'))

  const [{ n: refCount }] = await db
    .select({ n: count() })
    .from(orderItems)
    .where(eq(orderItems.variantId, variantId))
  const [{ n: cartRefCount }] = await db
    .select({ n: count() })
    .from(cartItems)
    .where(eq(cartItems.variantId, variantId))
  const [{ n: designRefCount }] = await db
    .select({ n: count() })
    .from(designs)
    .where(eq(designs.variantId, variantId))

  if (refCount + cartRefCount + designRefCount > 0) {
    return fail(c, '该规格已被订单/购物车/设计引用，无法删除', 409)
  }

  await db.delete(productVariants).where(eq(productVariants.id, variantId))
  return success(c, null)
})

app.get('/orders', requirePermission('order.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const status = c.req.query('status')

  const conditions = []
  if (status) conditions.push(eq(orders.status, status as 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [{ n: total }]] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(orders).where(where)
  ])

  return success(c, { items, total, page, limit })
})

app.get('/orders/:id', requirePermission('order.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      total: orders.total,
      address: orders.address,
      paidAt: orders.paidAt,
      shippedAt: orders.shippedAt,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
      trackingNo: orders.trackingNo,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1)

  if (!order) {
    return fail(c, '订单不存在', 404)
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
  return success(c, { ...order, items })
})

app.put('/orders/:id', requirePermission('order.update_status'), validateJson(orderStatusSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!existing) {
    return fail(c, '订单不存在', 404)
  }

  if (!canTransition(existing.status, data.status)) {
    return fail(c, `订单状态不能从 ${existing.status} 变更为 ${data.status}`, 400)
  }

  const now = new Date().toISOString()
  const statusTimestamp: Partial<{
    paidAt: string; shippedAt: string; completedAt: string; cancelledAt: string
    trackingNo: string
  }> = {}
  if (data.trackingNo !== undefined) statusTimestamp.trackingNo = data.trackingNo

  if (data.status === 'cancelled' && existing.status !== 'cancelled') {
    statusTimestamp.cancelledAt = now
    db.transaction((tx) => {
      tx.update(orders)
        .set({ status: 'cancelled', updatedAt: now, ...statusTimestamp })
        .where(eq(orders.id, id))
        .run()

      const items = tx.select().from(orderItems).where(eq(orderItems.orderId, id)).all()
      for (const item of items) {
        if (item.variantId !== null) {
          tx.update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(eq(productVariants.id, item.variantId))
            .run()
        } else {
          tx.update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId))
            .run()
        }
      }
    })
  } else {
    if (data.status === 'paid' && !existing.paidAt) statusTimestamp.paidAt = now
    if (data.status === 'shipped' && !existing.shippedAt) statusTimestamp.shippedAt = now
    if (data.status === 'completed' && !existing.completedAt) statusTimestamp.completedAt = now

    await db
      .update(orders)
      .set({ status: data.status, updatedAt: now, ...statusTimestamp })
      .where(eq(orders.id, id))
  }

  const userId = c.get('userId')
  trackBusinessEvent({
    c,
    userId,
    eventType: 'admin_action',
    metadata: { target: 'order', targetId: id, action: 'status_change', status: data.status }
  })

  return success(c, null)
})

app.route('/backup', backupRoutes)
app.route('/stickers', adminStickerRoutes)
app.route('/categories', adminCategoryRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/settings', settingsRoutes)
app.route('/staff', staffRoutes)
app.route('/roles', rolesRoutes)
app.route('/users', usersRoutes)
app.route('/uploads', uploadsRoutes)

export default app
