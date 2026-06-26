import { Hono } from 'hono'
import { db } from '../../db'
import { products, productVariants, categories, orderItems, orders } from '../../db/schema'
import { eq, count, sum, sql, isNull, isNotNull, and, gte } from 'drizzle-orm'
import { requirePermission } from '../../middleware/permission'
import { success } from '../../utils/response'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()

app.get('/summary', requirePermission('analytics.read'), async (c) => {
  const [productRow] = await db
    .select({ n: count(), totalValue: sum(sql`${products.basePrice} * ${products.stock}`) })
    .from(products)
    .where(isNull(products.deletedAt))

  const [variantRow] = await db
    .select({
      n: count(),
      totalValue: sum(sql`(${productVariants.priceAdjustment} + (SELECT base_price FROM products WHERE id = ${productVariants.productId})) * ${productVariants.stock}`),
    })
    .from(productVariants)

  const lowStockCount = db
    .select({ n: count() })
    .from(products)
    .where(and(isNull(products.deletedAt), sql`${products.stock} > 0`, sql`${products.stock} <= 5`))
    .all()

  const outOfStockCount = db
    .select({ n: count() })
    .from(products)
    .where(and(isNull(products.deletedAt), sql`${products.stock} = 0`))
    .all()

  const [catRow] = await db.select({ n: count() }).from(categories)
  const [variantCount] = await db.select({ n: count() }).from(productVariants)

  const productTotal = productRow?.n ?? 0
  const productValue = Number(productRow?.totalValue ?? 0)
  const variantValue = Number(variantRow?.totalValue ?? 0)

  return success(c, {
    productCount: productTotal,
    variantCount: variantCount?.n ?? 0,
    totalStock: productRow?.n
      ? db.select({ n: sum(products.stock) }).from(products).where(isNull(products.deletedAt)).all()[0]?.n ?? 0
      : 0,
    totalValue: Math.round((productValue + variantValue) * 100) / 100,
    lowStockCount: lowStockCount[0]?.n ?? 0,
    outOfStockCount: outOfStockCount[0]?.n ?? 0,
    categoryCount: catRow?.n ?? 0,
  })
})

app.get('/low-stock', requirePermission('analytics.read'), async (c) => {
  const threshold = Math.max(1, parseInt(c.req.query('threshold') ?? '5'))

  const items = db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      basePrice: products.basePrice,
      isActive: products.isActive,
      categoryName: categories.name,
      image: products.images,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(isNull(products.deletedAt), sql`${products.stock} <= ${threshold}`))
    .orderBy(sql`${products.stock} ASC`)
    .limit(50)
    .all()

  const enriched = items.map((item) => {
    const images = item.image ? JSON.parse(item.image) : []
    return {
      ...item,
      image: Array.isArray(images) ? (images[0] ?? null) : (item.image ?? null),
    }
  })

  return success(c, { items: enriched, total: enriched.length, threshold })
})

app.get('/by-category', requirePermission('analytics.read'), async (c) => {
  type CatRow = {
    categoryId: number | null
    categoryName: string | null
    productCount: number
    totalStock: number
    totalValue: number
  }

  const raw = db
    .select({
      categoryId: products.categoryId,
      categoryName: categories.name,
      productCount: count(),
      totalStock: sum(products.stock),
      totalValue: sum(sql`${products.basePrice} * ${products.stock}`),
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(isNull(products.deletedAt))
    .groupBy(products.categoryId)
    .all() as unknown as CatRow[]

  const items = raw.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? '未分类',
    productCount: r.productCount,
    totalStock: Number(r.totalStock ?? 0),
    totalValue: Math.round(Number(r.totalValue ?? 0) * 100) / 100,
  }))

  items.sort((a, b) => b.totalStock - a.totalStock)

  return success(c, { items })
})

app.get('/turnover', requirePermission('analytics.read'), async (c) => {
  const days = Math.max(1, parseInt(c.req.query('days') ?? '30'))

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [soldRow] = await db
    .select({ n: sum(orderItems.quantity) })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(gte(orders.paidAt, cutoff), isNotNull(orders.paidAt)))
    .all()

  const soldTotal = Number(soldRow?.n ?? 0)

  const [stockRow] = await db
    .select({ n: sum(products.stock) })
    .from(products)
    .where(isNull(products.deletedAt))
    .all()

  const avgStock = Number(stockRow?.n ?? 0)

  return success(c, {
    periodDays: days,
    soldQuantity: soldTotal,
    avgStock: avgStock,
    turnoverRate: avgStock > 0 ? Math.round((soldTotal / avgStock) * 100) / 100 : 0,
  })
})

export default app
