import { Hono } from 'hono'
import { db } from '../db'
import { categories, products } from '../db/schema'
import { eq, count, and, isNull, asc, sql } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { categorySchema, categoryReorderSchema } from '../validators'
import type { AppEnv } from '../types/hono'

const publicApp = new Hono()

publicApp.get('/', async (c) => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      sort: categories.sort,
      productCount: count(products.id)
    })
    .from(categories)
    .leftJoin(
      products,
      and(
        eq(products.categoryId, categories.id),
        eq(products.isActive, true),
        isNull(products.deletedAt)
      )
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sort), asc(categories.id))

  return success(c, { items: rows })
})

publicApp.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const [item] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!item) {
    return fail(c, '分类不存在', 404)
  }
  return success(c, item)
})

export { publicApp as categoryRoutes }

const adminApp = new Hono<AppEnv>()
adminApp.use('*', auth)
adminApp.use('*', requireStaff)

adminApp.post('/', requirePermission('category.create'), validateJson(categorySchema), async (c) => {
  const data = c.req.valid('json')

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, data.slug))
    .limit(1)
  if (existing.length > 0) {
    return fail(c, '标识已存在')
  }

  const [maxRow] = await db
    .select({ s: sql<number>`COALESCE(MAX(${categories.sort}), -1)` })
    .from(categories)

  const [record] = await db
    .insert(categories)
    .values({ ...data, sort: maxRow.s + 1 })
    .returning()
  return success(c, record, 201)
})

adminApp.put('/reorder', requirePermission('category.update'), validateJson(categoryReorderSchema), async (c) => {
  const items = c.req.valid('json')

  db.transaction((tx) => {
    for (const item of items) {
      tx.update(categories).set({ sort: item.sort }).where(eq(categories.id, item.id)).run()
    }
  })

  return success(c, null)
})

adminApp.put('/:id', requirePermission('category.update'), validateJson(categorySchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)
  if (!existing) {
    return fail(c, '分类不存在', 404)
  }

  await db.update(categories).set(data).where(eq(categories.id, id))
  return success(c, null)
})

adminApp.delete('/:id', requirePermission('category.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const reassignToRaw = c.req.query('reassignTo')
  const reassignTo = reassignToRaw ? parseInt(reassignToRaw) : null

  const [{ n: refCount }] = await db
    .select({ n: count() })
    .from(products)
    .where(and(eq(products.categoryId, id), isNull(products.deletedAt)))

  if (refCount > 0) {
    if (reassignTo === null || !Number.isFinite(reassignTo)) {
      return fail(c, `该分类下还有 ${refCount} 个商品，请指定 reassignTo 参数将商品移到其他分类`, 409)
    }
    if (reassignTo === id) {
      return fail(c, '目标分类不能与当前分类相同', 400)
    }
    const [target] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, reassignTo))
      .limit(1)
    if (!target) {
      return fail(c, '目标分类不存在', 404)
    }
  }

  db.transaction((tx) => {
    if (refCount > 0) {
      tx.update(products)
        .set({ categoryId: reassignTo })
        .where(eq(products.categoryId, id))
        .run()
    }
    tx.delete(categories).where(eq(categories.id, id)).run()
  })

  return success(c, { reassigned: refCount })
})

export { adminApp as adminCategoryRoutes }
