import { Hono } from 'hono'
import { db } from '../db'
import { designs } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { designSchema } from '../validators'
import { trackBusinessEvent } from '../utils/track'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

app.get('/', async (c) => {
  const userId = c.get('userId')
  const items = await db
    .select()
    .from(designs)
    .where(eq(designs.userId, userId))
    .orderBy(desc(designs.updatedAt))

  return success(c, { items })
})

app.post('/', validateJson(designSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')
  const [record] = await db.insert(designs).values({ ...data, userId }).returning()

  trackBusinessEvent({
    c,
    userId,
    eventType: 'design_save',
    metadata: { designId: record.id, productId: data.productId }
  })

  return success(c, record, 201)
})

app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [design] = await db
    .select()
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)

  if (!design) {
    return fail(c, '设计不存在', 404)
  }
  return success(c, design)
})

app.put('/:id', validateJson(designSchema), async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: designs.id })
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)
  if (!existing) {
    return fail(c, '设计不存在', 404)
  }

  await db
    .update(designs)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))

  trackBusinessEvent({
    c,
    userId,
    eventType: 'design_save',
    metadata: { designId: id, productId: data.productId }
  })

  return success(c, null)
})

app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  await db
    .delete(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))

  trackBusinessEvent({ c, userId, eventType: 'design_delete', metadata: { designId: id } })

  return success(c, null)
})

export default app
