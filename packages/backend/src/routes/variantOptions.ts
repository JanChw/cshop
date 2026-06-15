import { Hono } from 'hono'
import { db } from '../db'
import { variantOptions } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { variantOptionSchema, variantOptionUpdateSchema } from '../validators'
import type { AppEnv } from '../types/hono'

const publicApp = new Hono()

publicApp.get('/', async (c) => {
  const type = c.req.query('type') as 'material' | 'weight' | 'size' | 'color' | undefined
  const conditions = type ? eq(variantOptions.type, type) : undefined
  const items = db
    .select()
    .from(variantOptions)
    .where(conditions)
    .orderBy(asc(variantOptions.sort), asc(variantOptions.id))
    .all()
  return success(c, { items })
})

export { publicApp as variantOptionsRoutes }

const adminApp = new Hono<AppEnv>()
adminApp.use('*', auth)
adminApp.use('*', requireStaff)

adminApp.get('/', requirePermission('settings.read'), async (c) => {
  const type = c.req.query('type') as 'material' | 'weight' | 'size' | 'color' | undefined
  const conditions = type ? eq(variantOptions.type, type) : undefined
  const items = db
    .select()
    .from(variantOptions)
    .where(conditions)
    .orderBy(asc(variantOptions.sort), asc(variantOptions.id))
    .all()
  return success(c, { items })
})

adminApp.post('/', requirePermission('settings.update'), validateJson(variantOptionSchema), async (c) => {
  const data = c.req.valid('json')
  const [record] = db.insert(variantOptions).values({
    type: data.type,
    value: data.value,
    sort: data.sort ?? 0
  }).returning().all()
  return success(c, record, 201)
})

adminApp.put('/:id', requirePermission('settings.update'), validateJson(variantOptionUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = db.select({ id: variantOptions.id }).from(variantOptions).where(eq(variantOptions.id, id)).limit(1).all()
  if (!existing) return fail(c, '选项不存在', 404)

  db.update(variantOptions).set(data).where(eq(variantOptions.id, id)).run()
  return success(c, null)
})

adminApp.delete('/:id', requirePermission('settings.update'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = db.select({ id: variantOptions.id }).from(variantOptions).where(eq(variantOptions.id, id)).limit(1).all()
  if (!existing) return fail(c, '选项不存在', 404)
  db.delete(variantOptions).where(eq(variantOptions.id, id)).run()
  return success(c, null)
})

export { adminApp as adminVariantOptionsRoutes }
