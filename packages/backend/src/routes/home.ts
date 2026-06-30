import { Hono } from 'hono'
import { db } from '../db'
import { homeSections } from '../db/schema'
import { eq, asc } from 'drizzle-orm'
import { success, fail } from '../utils/response'

const app = new Hono()

// Parse the JSON blob stored in home_sections.data; tolerate corruption
// rather than letting it bubble to the global 500 handler.
function parseSectionData (raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error('[home] corrupt section.data, falling back to empty object:', err)
    return {}
  }
}

app.get('/', async (c) => {
  const items = db
    .select()
    .from(homeSections)
    .where(eq(homeSections.isActive, true))
    .orderBy(asc(homeSections.sort), asc(homeSections.id))
    .all()

  const parsed = items.map(section => ({
    ...section,
    data: parseSectionData(section.data)
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
    return fail(c, '区块不存在', 404)
  }

  return success(c, { ...section, data: parseSectionData(section.data) })
})

export default app
