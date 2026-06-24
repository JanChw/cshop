import { Hono } from 'hono'
import { db } from '../db'
import { homeSections } from '../db/schema'
import { eq, asc } from 'drizzle-orm'
import { success } from '../utils/response'

const app = new Hono()

app.get('/', async (c) => {
  const items = db
    .select()
    .from(homeSections)
    .where(eq(homeSections.isActive, true))
    .orderBy(asc(homeSections.sort), asc(homeSections.id))
    .all()

  const parsed = items.map(section => ({
    ...section,
    data: JSON.parse(section.data)
  }))

  return success(c, { items: parsed })
})

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const [section] = db
    .select()
    .from(homeSections)
    .where(eq(homeSections.id, id))
    .limit(1)
    .all()

  if (!section) {
    return c.json({ success: false, data: null, error: '区块不存在' }, 404)
  }

  return success(c, { ...section, data: JSON.parse(section.data) })
})

export default app
