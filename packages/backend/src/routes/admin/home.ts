import { Hono } from 'hono'
import { db } from '../../db'
import { homeSections } from '../../db/schema'
import { eq, asc } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { homeSectionSchema, homeSectionUpdateSchema, homeSectionReorderSchema } from '../../validators'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('home-sections.read'), async (c) => {
  const items = db.select().from(homeSections).orderBy(asc(homeSections.sort), asc(homeSections.id)).all()
  return success(c, { items })
})

app.get('/:id', requirePermission('home-sections.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [section] = db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1).all()
  if (!section) return fail(c, '区块不存在', 404)
  return success(c, section)
})

app.post('/', requirePermission('home-sections.update'), validateJson(homeSectionSchema), async (c) => {
  const data = c.req.valid('json')
  const [record] = db.insert(homeSections).values({
    type: data.type,
    data: data.data,
    title: data.title ?? null,
    subTitle: data.subTitle ?? null,
    sort: data.sort ?? 0,
    isActive: data.isActive ?? true
  }).returning().all()
  return success(c, record, 201)
})

app.put('/:id', requirePermission('home-sections.update'), validateJson(homeSectionUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = db.select({ id: homeSections.id }).from(homeSections).where(eq(homeSections.id, id)).limit(1).all()
  if (!existing) return fail(c, '区块不存在', 404)

  db.update(homeSections).set({
    ...data,
    updatedAt: new Date().toISOString()
  }).where(eq(homeSections.id, id)).run()
  return success(c, null)
})

app.delete('/:id', requirePermission('home-sections.update'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = db.select({ id: homeSections.id }).from(homeSections).where(eq(homeSections.id, id)).limit(1).all()
  if (!existing) return fail(c, '区块不存在', 404)
  db.delete(homeSections).where(eq(homeSections.id, id)).run()
  return success(c, null)
})

app.put('/reorder', requirePermission('home-sections.update'), validateJson(homeSectionReorderSchema), async (c) => {
  const items = c.req.valid('json')
  db.transaction((tx) => {
    for (const item of items) {
      tx.update(homeSections).set({ sort: item.sort, updatedAt: new Date().toISOString() }).where(eq(homeSections.id, item.id)).run()
    }
  })
  return success(c, null)
})

export default app
