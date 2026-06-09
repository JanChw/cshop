import { Hono } from 'hono'
import { db } from '../db'
import { menus } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const type = (c.req.query('type') as 'nav' | 'admin') ?? 'nav'

  const all = db
    .select()
    .from(menus)
    .where(and(eq(menus.type, type), eq(menus.isVisible, true)))
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
      id: item.id,
      name: item.name,
      path: item.path,
      icon: item.icon,
      children: buildTree(item.id)
    }))
  }

  return c.json({ success: true, data: { items: buildTree(null) } })
})

export default app
