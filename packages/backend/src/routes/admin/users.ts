import { Hono } from 'hono'
import { db } from '../../db'
import { users, orders, staff } from '../../db/schema'
import { eq, desc, count, sql, and, ne, isNull } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { z } from 'zod'
import type { AppEnv } from '../../types/hono'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  disabled: z.boolean().optional()
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, '密码至少6位')
})

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('user.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const search = c.req.query('q')
  const role = c.req.query('role')
  const disabled = c.req.query('disabled')

  const conditions = []
  if (search) {
    const escaped = search.replace(/[\\%_]/g, ch => '\\' + ch)
    conditions.push(sql`(${users.email} LIKE ${'%' + escaped + '%'} ESCAPE '\\' OR ${users.name} LIKE ${'%' + escaped + '%'} ESCAPE '\\')`)
  }
  if (role === 'admin' || role === 'customer') {
    conditions.push(eq(users.role, role))
  }
  if (disabled === 'true') conditions.push(eq(users.disabled, true))
  if (disabled === 'false') conditions.push(eq(users.disabled, false))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        disabled: users.disabled,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        isStaff: sql<number>`CASE WHEN ${staff.id} IS NOT NULL THEN 1 ELSE 0 END`,
        staffStatus: staff.status
      })
      .from(users)
      .leftJoin(staff, eq(users.id, staff.userId))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ n: count() }).from(users).where(where)
  ])

  return success(c, { items, total, page, limit })
})

app.get('/:id', requirePermission('user.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      disabled: users.disabled,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) {
    return fail(c, '用户不存在', 404)
  }

  const [orderCount] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.userId, id))

  return success(c, { ...user, orderCount: orderCount?.n ?? 0 })
})

app.put('/:id', requirePermission('user.update'), validateJson(updateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing) {
    return fail(c, '用户不存在', 404)
  }

  const currentUserId = c.get('userId')
  if (id === currentUserId && data.disabled === true) {
    return fail(c, '不能禁用自己', 400)
  }

  const updates: Partial<{ name: string; disabled: boolean }> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.disabled !== undefined) updates.disabled = data.disabled

  if (Object.keys(updates).length === 0) {
    return fail(c, '没有可更新的字段', 400)
  }

  await db.update(users).set(updates).where(eq(users.id, id))
  return success(c, null)
})

app.delete('/:id', requirePermission('user.disable'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const currentUserId = c.get('userId')

  if (id === currentUserId) {
    return fail(c, '不能删除自己', 400)
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing) {
    return fail(c, '用户不存在', 404)
  }

  const [orderCount] = await db.select({ n: count() }).from(orders).where(eq(orders.userId, id))
  if ((orderCount?.n ?? 0) > 0) {
    await db.update(users).set({ disabled: true }).where(eq(users.id, id))
    return success(c, { id, softDeleted: true, reason: '用户有订单记录，已禁用账号' })
  }

  await db.delete(users).where(eq(users.id, id))
  return success(c, { id, softDeleted: false })
})

app.post('/:id/reset-password', requirePermission('user.disable'), validateJson(resetPasswordSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const { newPassword } = c.req.valid('json')

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing) {
    return fail(c, '用户不存在', 404)
  }

  const newHash = await Bun.password.hash(newPassword, { algorithm: 'bcrypt', cost: 10 })
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, id))

  // Revoke all of this user's sessions
  const { sessions } = await import('../../db/schema')
  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)))

  return success(c, null)
})

export default app
