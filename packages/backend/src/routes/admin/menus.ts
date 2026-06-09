import { Hono } from 'hono'
import { db } from '../../db'
import { menus } from '../../db/schema'
import { eq, asc, and, inArray, isNull } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { menuSchema, menuUpdateSchema, menuReorderSchema } from '../../validators'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('menu.read'), async (c) => {
  const type = c.req.query('type') as 'admin' | 'nav' | undefined
  const conditions = []
  if (type) conditions.push(eq(menus.type, type))

  const all = db
    .select()
    .from(menus)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(menus.sort), asc(menus.id))
    .all()

  const children = new Map<number | null, typeof all>()
  for (const item of all) {
    const pid = item.parentId ?? null
    if (!children.has(pid)) children.set(pid, [])
    children.get(pid)!.push(item)
  }

  function buildTree(parentId: number | null): Array<Record<string, unknown>> {
    return (children.get(parentId) ?? []).map(item => ({
      ...item,
      children: buildTree(item.id)
    }))
  }

  return success(c, { items: buildTree(null) })
})

app.post('/', requirePermission('menu.create'), validateJson(menuSchema), async (c) => {
  const data = c.req.valid('json')

  if (data.parentId) {
    const [parent] = db.select({ id: menus.id }).from(menus).where(eq(menus.id, data.parentId)).limit(1).all()
    if (!parent) {
      return fail(c, '父级菜单不存在', 404)
    }
  }

  const [record] = db.insert(menus).values({
    parentId: data.parentId ?? null,
    name: data.name,
    path: data.path,
    icon: data.icon ?? null,
    sort: data.sort ?? 0,
    isVisible: data.isVisible ?? true,
    type: data.type ?? 'admin'
  }).returning().all()

  return success(c, record, 201)
})

app.put('/:id', requirePermission('menu.update'), validateJson(menuUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = db.select({ id: menus.id }).from(menus).where(eq(menus.id, id)).limit(1).all()
  if (!existing) {
    return fail(c, '菜单不存在', 404)
  }

  if (data.parentId) {
    if (data.parentId === id) {
      return fail(c, '不能将自己设为自己的父级', 400)
    }
    const [parent] = db.select({ id: menus.id }).from(menus).where(eq(menus.id, data.parentId)).limit(1).all()
    if (!parent) {
      return fail(c, '父级菜单不存在', 404)
    }
  }

  db.update(menus).set(data).where(eq(menus.id, id)).run()
  return success(c, null)
})

app.delete('/:id', requirePermission('menu.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = db.select({ id: menus.id }).from(menus).where(eq(menus.id, id)).limit(1).all()
  if (!existing) {
    return fail(c, '菜单不存在', 404)
  }

  db.delete(menus).where(eq(menus.parentId, id)).run()
  db.delete(menus).where(eq(menus.id, id)).run()
  return success(c, null)
})

app.put('/reorder', requirePermission('menu.update'), validateJson(menuReorderSchema), async (c) => {
  const items = c.req.valid('json')

  db.transaction((tx) => {
    for (const item of items) {
      tx.update(menus).set({
        parentId: item.parentId,
        sort: item.sort
      }).where(eq(menus.id, item.id)).run()
    }
  })

  return success(c, null)
})

export default app
