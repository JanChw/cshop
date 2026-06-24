import { Hono } from 'hono'
import { db } from '../db'
import { products, productVariants, productVariantOptions, productBaseDesigns } from '../db/schema'
import { eq, and, count, asc, isNull, type SQL, sql } from 'drizzle-orm'
import { success, fail } from '../utils/response'
import { trackBusinessEvent } from '../utils/track'
import { authOptional } from '../middleware/auth'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.get('*', authOptional)

app.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const categoryId = c.req.query('categoryId')
  const q = c.req.query('q')?.trim()
  const offset = (page - 1) * limit

  const conditions: SQL[] = [eq(products.isActive, true), isNull(products.deletedAt)]
  if (categoryId) {
    const cid = parseInt(categoryId)
    if (Number.isFinite(cid)) {
      conditions.push(eq(products.categoryId, cid))
    }
  }
  if (q) {
    const escaped = q.replace(/[\\%_]/g, ch => '\\' + ch)
    conditions.push(sql`${products.name} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`)
  }
  const where = and(...conditions)!

  const [items, [{ n: total }]] = await Promise.all([
    db.select().from(products).where(where).limit(limit).offset(offset),
    db.select({ n: count() }).from(products).where(where)
  ])

  return success(c, { items: items.map(i => ({ ...i, images: i.images ? JSON.parse(i.images) : [] })), total, page, limit })
})

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isActive, true), isNull(products.deletedAt)))
    .limit(1)
  if (!product) {
    return fail(c, '商品不存在', 404)
  }

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))

  const userId = c.get('userId')
  trackBusinessEvent({
    c,
    userId: userId ?? null,
    eventType: 'product_view',
    metadata: { productId: id, productName: product.name }
  })

  product.images = product.images ? JSON.parse(product.images) : []
  return success(c, { ...product, variants })
})

app.get('/:id/variant-options', async (c) => {
  const productId = parseInt(c.req.param('id'))
  const type = c.req.query('type') as 'material' | 'weight' | 'size' | 'color' | undefined

  const conditions = type
    ? and(eq(productVariantOptions.productId, productId), eq(productVariantOptions.type, type))
    : eq(productVariantOptions.productId, productId)

  const items = db
    .select()
    .from(productVariantOptions)
    .where(conditions)
    .orderBy(asc(productVariantOptions.sort), asc(productVariantOptions.id))
    .all()
  return success(c, { items })
})

app.get('/:id/base-design', async (c) => {
  const productId = parseInt(c.req.param('id'))
  const [design] = await db
    .select()
    .from(productBaseDesigns)
    .where(eq(productBaseDesigns.productId, productId))
    .limit(1)
  return success(c, design
    ? { originalImage: design.originalImage, frontImage: design.frontImage, maskImage: design.maskImage }
    : { originalImage: null, frontImage: null, maskImage: null })
})

export default app
