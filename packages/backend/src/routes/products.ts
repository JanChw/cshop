import { Hono } from 'hono'
import { db } from '../db'
import { products, productVariants } from '../db/schema'
import { eq, and, count, type SQL, sql } from 'drizzle-orm'
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

  const conditions: SQL[] = [eq(products.isActive, true)]
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

  return success(c, { items, total, page, limit })
})

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isActive, true)))
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

  return success(c, { ...product, variants })
})

export default app
