import { Hono } from 'hono'
import { db } from '../db'
import { categories, products } from '../db/schema'
import { eq, count } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { categorySchema } from '../validators'
import type { AppEnv } from '../types/hono'

const publicApp = new Hono()

publicApp.get('/', async (c) => {
  const items = await db.select().from(categories)
  return success(c, { items })
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

  const [record] = await db.insert(categories).values(data).returning()
  return success(c, record, 201)
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

  const [{ n: refCount }] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.categoryId, id))
  if (refCount > 0) {
    return fail(c, `该分类下还有 ${refCount} 个商品，无法删除`, 409)
  }

  await db.delete(categories).where(eq(categories.id, id))
  return success(c, null)
})

export { adminApp as adminCategoryRoutes }
