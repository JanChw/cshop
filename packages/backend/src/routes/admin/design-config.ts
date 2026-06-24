import { Hono } from 'hono'
import { db } from '../../db'
import { designConfigs } from '../../db/schema'
import { eq, asc, and } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { designConfigSchema, designConfigUpdateSchema } from '../../validators'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

type ConfigGroup = 'tshirt_color' | 'text_palette' | 'font' | 'brush_color' | 'brush_style'

app.get('/', requirePermission('design-configs.read'), async (c) => {
  const group = c.req.query('group') as ConfigGroup | undefined
  const conditions = group ? [eq(designConfigs.configGroup, group as typeof designConfigs.$inferSelect.configGroup)] : []
  const items = db
    .select()
    .from(designConfigs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(designConfigs.configGroup), asc(designConfigs.sort), asc(designConfigs.id))
    .all()
  return success(c, { items })
})

app.get('/:id', requirePermission('design-configs.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [config] = db.select().from(designConfigs).where(eq(designConfigs.id, id)).limit(1).all()
  if (!config) return fail(c, '配置项不存在', 404)
  return success(c, config)
})

app.post('/', requirePermission('design-configs.create'), validateJson(designConfigSchema), async (c) => {
  const data = c.req.valid('json')
  const [record] = db.insert(designConfigs).values({
    configGroup: data.group,
    name: data.name,
    value: data.value,
    extra: data.extra ?? null,
    sort: data.sort ?? 0,
    isActive: data.isActive ?? true
  }).returning().all()
  return success(c, record, 201)
})

app.put('/:id', requirePermission('design-configs.update'), validateJson(designConfigUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = db.select({ id: designConfigs.id }).from(designConfigs).where(eq(designConfigs.id, id)).limit(1).all()
  if (!existing) return fail(c, '配置项不存在', 404)

  db.update(designConfigs).set(data).where(eq(designConfigs.id, id)).run()
  return success(c, null)
})

app.delete('/:id', requirePermission('design-configs.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = db.select({ id: designConfigs.id }).from(designConfigs).where(eq(designConfigs.id, id)).limit(1).all()
  if (!existing) return fail(c, '配置项不存在', 404)
  db.delete(designConfigs).where(eq(designConfigs.id, id)).run()
  return success(c, null)
})

export default app
