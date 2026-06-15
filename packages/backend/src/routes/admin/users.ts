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
  status: z.enum(['active', 'disabled']).optional()
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
  const status = c.req.query('status')

  const conditions = [isNull(staff.id)]
  if (search) {
    const escaped = search.replace(/[\\%_]/g, ch => '\\' + ch)
    conditions.push(sql`(${users.email} LIKE ${'%' + escaped + '%'} ESCAPE '\\' OR ${users.name} LIKE ${'%' + escaped + '%'} ESCAPE '\\')`)
  }
  if (status === 'active' || status === 'disabled' || status === 'deactivated') {
    conditions.push(eq(users.status, status))
  }

  const where = and(...conditions)

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        orderCount: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.userId} = ${users.id})`
      })
      .from(users)
      .leftJoin(staff, eq(users.id, staff.userId))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ n: count() })
      .from(users)
      .leftJoin(staff, eq(users.id, staff.userId))
      .where(where)
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
      status: users.status,
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
  if (id === currentUserId && data.status === 'disabled') {
    return fail(c, '不能禁用自己', 400)
  }

  if (existing.status === 'deactivated') {
    return fail(c, '用户已注销，状态不可变更', 400)
  }

  const updates: Partial<{ name: string; status: 'active' | 'disabled' }> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.status !== undefined) updates.status = data.status

  if (Object.keys(updates).length === 0) {
    return fail(c, '没有可更新的字段', 400)
  }

  await db.update(users).set(updates).where(eq(users.id, id))
  return success(c, null)
})

// NOTE: 管理员不能删除用户。用户自己可通过 POST /account/deactivate 注销账号。

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
