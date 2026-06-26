import { Hono } from 'hono'
import { db } from '../db'
import { userFavorites, products } from '../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { z } from 'zod'
import { validateJson } from '../utils/validate'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

const favoriteSchema = z.object({
  productId: z.number().int().positive()
})

// List current user's favorites with product info
app.get('/', async (c) => {
  const userId = c.get('userId')!

  const rows = await db
    .select({
      id: userFavorites.id,
      productId: userFavorites.productId,
      createdAt: userFavorites.createdAt,
      name: products.name,
      basePrice: products.basePrice,
      originalPrice: products.originalPrice,
      images: products.images,
      designer: products.designer,
      tags: products.tags
    })
    .from(userFavorites)
    .innerJoin(products, eq(userFavorites.productId, products.id))
    .where(and(eq(userFavorites.userId, userId), sql`${products.deletedAt} IS NULL`))
    .orderBy(desc(userFavorites.createdAt))

  const items = rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    createdAt: r.createdAt,
    product: {
      id: r.productId,
      name: r.name,
      basePrice: r.basePrice,
      originalPrice: r.originalPrice,
      images: r.images ? JSON.parse(r.images) : [],
      designer: r.designer,
      tags: r.tags ? JSON.parse(r.tags) : []
    }
  }))

  return success(c, { items, total: items.length })
})

// Add favorite
app.post('/', validateJson(favoriteSchema), async (c) => {
  const userId = c.get('userId')!
  const { productId } = c.req.valid('json')

  const [product] = await db.select({ id: products.id }).from(products)
    .where(and(eq(products.id, productId), sql`${products.deletedAt} IS NULL`))
    .limit(1)
  if (!product) return fail(c, '商品不存在', 404)

  const [existing] = await db.select({ id: userFavorites.id }).from(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId)))
    .limit(1)

  if (existing) {
    return success(c, { id: existing.id, productId, favorited: true })
  }

  const [created] = await db.insert(userFavorites)
    .values({ userId, productId })
    .returning()
    .all()

  return success(c, { id: created.id, productId, favorited: true }, 201)
})

// Check favorite status
app.get('/:productId/check', async (c) => {
  const userId = c.get('userId')!
  const productId = parseInt(c.req.param('productId'))
  if (!Number.isFinite(productId)) return fail(c, '无效的商品 ID', 400)

  const [row] = await db.select({ id: userFavorites.id }).from(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId)))
    .limit(1)

  return success(c, { favorited: !!row })
})

// Remove favorite
app.delete('/:productId', async (c) => {
  const userId = c.get('userId')!
  const productId = parseInt(c.req.param('productId'))
  if (!Number.isFinite(productId)) return fail(c, '无效的商品 ID', 400)

  await db.delete(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId)))
    .run()

  return success(c, { productId, favorited: false })
})

export default app
