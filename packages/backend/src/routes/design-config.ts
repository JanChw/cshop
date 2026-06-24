import { Hono } from 'hono'
import { db } from '../db'
import { designConfigs } from '../db/schema'
import { eq, asc, and } from 'drizzle-orm'
import { success } from '../utils/response'

const app = new Hono()

type ConfigGroup = 'tshirt_color' | 'text_palette' | 'font' | 'brush_color' | 'brush_style'

app.get('/', async (c) => {
  const group = c.req.query('group') as ConfigGroup | undefined
  const conditions = [eq(designConfigs.isActive, true)]
  if (group) conditions.push(eq(designConfigs.configGroup, group as typeof designConfigs.$inferSelect.configGroup))

  const items = db
    .select()
    .from(designConfigs)
    .where(and(...conditions))
    .orderBy(asc(designConfigs.configGroup), asc(designConfigs.sort), asc(designConfigs.id))
    .all()

  const parsed = items.map(item => ({
    ...item,
    extra: item.extra ? JSON.parse(item.extra) : null
  }))

  return success(c, { items: parsed })
})

export default app
