import { Hono } from 'hono'
import { db } from '../db'
import { products, productVariants, productVariantOptions, productBaseDesigns } from '../db/schema'
import { eq, and, count, asc, isNull, type SQL, sql } from 'drizzle-orm'
import { success, fail } from '../utils/response'
import { parsePagination, escapeLikePattern } from '../utils/request'
import { trackBusinessEvent } from '../utils/track'
import { authOptional } from '../middleware/auth'
import { imagesForProducts, imagesForProduct } from '../utils/productImages'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.get('*', authOptional)

app.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(c)
  const categoryId = c.req.query('categoryId')
  const q = c.req.query('q')?.trim()

  const conditions: SQL[] = [eq(products.isActive, true), isNull(products.deletedAt)]
  if (categoryId) {
    const cid = parseInt(categoryId)
    if (Number.isFinite(cid)) {
      conditions.push(eq(products.categoryId, cid))
    }
  }
  if (q) {
    const escaped = escapeLikePattern(q)
    conditions.push(sql`${products.name} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`)
  }
  const where = and(...conditions)!

  const [items, [{ n: total }]] = await Promise.all([
    db.select({
      id: products.id,
      name: products.name,
      basePrice: products.basePrice,
      originalPrice: products.originalPrice,
      categoryId: products.categoryId,
      description: products.description,
      isActive: products.isActive,
      createdAt: products.createdAt
    }).from(products).where(where).limit(limit).offset(offset),
    db.select({ n: count() }).from(products).where(where)
  ])

  const imageMap = imagesForProducts(items.map(i => i.id))
  return success(c, {
    items: items.map(i => ({ ...i, images: imageMap.get(i.id) ?? [] })),
    total, page, limit
  })
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

  return success(c, { ...product, images: imagesForProduct(id), variants })
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
    ? { originalImage: design.originalImage, frontImage: design.frontImage, maskImage: design.maskImage, inverseMask: design.inverseMask }
    : { originalImage: null, frontImage: null, maskImage: null, inverseMask: null })
})

export default app
