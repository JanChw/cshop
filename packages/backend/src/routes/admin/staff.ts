import { Hono } from 'hono'
import { db } from '../../db'
import { staff, users, roles, orders } from '../../db/schema'
import { eq, desc, count, and, ne, sql } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { z } from 'zod'
import type { AppEnv } from '../../types/hono'

const createSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '名称不能为空'),
  roleId: z.number().int().positive(),
  employeeNo: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional()
})

const updateSchema = z.object({
  roleId: z.number().int().positive().optional(),
  employeeNo: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  position: z.string().nullable().optional()
})

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('staff.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const search = c.req.query('q')?.trim()
  const role = c.req.query('role')
  const status = c.req.query('status')

  const conditions = []
  if (search) {
    const escaped = search.replace(/[\\%_]/g, ch => '\\' + ch)
    conditions.push(sql`(${users.email} LIKE ${'%' + escaped + '%'} ESCAPE '\\' OR ${users.name} LIKE ${'%' + escaped + '%'} ESCAPE '\\')`)
  }
  if (role) conditions.push(eq(roles.name, role))
  if (status === 'active' || status === 'suspended' || status === 'resigned') {
    conditions.push(eq(staff.status, status))
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select({
        id: staff.id,
        userId: staff.userId,
        roleId: staff.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        employeeNo: staff.employeeNo,
        department: staff.department,
        position: staff.position,
        status: staff.status,
        hiredAt: staff.hiredAt,
        lastLoginAt: staff.lastLoginAt,
        createdAt: staff.createdAt,
        email: users.email,
        name: users.name
      })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id))
      .innerJoin(roles, eq(staff.roleId, roles.id))
      .where(where)
      .orderBy(desc(staff.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ n: count() })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id))
      .innerJoin(roles, eq(staff.roleId, roles.id))
      .where(where)
  ])

  return success(c, { items, total, page, limit })
})

app.post('/', requirePermission('staff.create'), validateJson(createSchema), async (c) => {
  const data = c.req.valid('json')

  const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
  if (existing) {
    return fail(c, '邮箱已注册')
  }

  const [role] = await db.select().from(roles).where(eq(roles.id, data.roleId)).limit(1)
  if (!role) {
    return fail(c, '角色不存在', 404)
  }

  const currentRoleName = c.get('roleName')
  if (role.name === 'super_admin' && currentRoleName !== 'super_admin') {
    return fail(c, '只有超级管理员可以创建超级管理员', 403)
  }

  const passwordHash = await Bun.password.hash(data.password, { algorithm: 'bcrypt', cost: 10 })
  const now = new Date().toISOString()

  const newUser = db.transaction((tx) => {
    const [u] = tx.insert(users).values({
      email: data.email,
      passwordHash,
      name: data.name
    }).returning().all()

    const [s] = tx.insert(staff).values({
      userId: u.id,
      roleId: data.roleId,
      employeeNo: data.employeeNo ?? null,
      department: data.department ?? null,
      position: data.position ?? null,
      status: 'active',
      hiredAt: now
    }).returning().all()

    return { user: u, staff: s }
  })

  return success(c, {
    id: newUser.staff.id,
    userId: newUser.user.id,
    email: newUser.user.email,
    name: newUser.user.name,
    roleId: data.roleId,
    roleName: role.name,
    status: 'active'
  }, 201)
})

app.put('/:id', requirePermission('staff.update'), validateJson(updateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select().from(staff).where(eq(staff.id, id)).limit(1)
  if (!existing) {
    return fail(c, '员工不存在', 404)
  }

  if (data.roleId !== undefined) {
    const [role] = await db.select().from(roles).where(eq(roles.id, data.roleId)).limit(1)
    if (!role) {
      return fail(c, '角色不存在', 404)
    }
    const currentRoleName = c.get('roleName')
    if (role.name === 'super_admin' && currentRoleName !== 'super_admin') {
      return fail(c, '只有超级管理员可以将角色设置为超级管理员', 403)
    }
  }

  const currentUserId = c.get('userId')
  const [currentStaff] = await db.select().from(staff).where(eq(staff.userId, currentUserId)).limit(1)
  if (currentStaff?.id === id) {
    return fail(c, '不能修改自己的员工记录', 400)
  }

  await db.update(staff).set({
    ...data,
    updatedAt: new Date().toISOString()
  }).where(eq(staff.id, id))

  return success(c, null)
})

app.post('/:id/resign', requirePermission('staff.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = await db.select().from(staff).where(eq(staff.id, id)).limit(1)
  if (!existing) {
    return fail(c, '员工不存在', 404)
  }
  if (existing.status === 'resigned') {
    return fail(c, '员工已是离职状态', 409)
  }

  const currentUserId = c.get('userId')
  const [currentStaff] = await db.select().from(staff).where(eq(staff.userId, currentUserId)).limit(1)
  if (currentStaff?.id === id) {
    return fail(c, '不能停用自己', 400)
  }

  await db.update(staff).set({ status: 'resigned', updatedAt: new Date().toISOString() }).where(eq(staff.id, id))

  return success(c, { id, status: 'resigned' })
})

app.delete('/:id', requirePermission('staff.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = await db.select().from(staff).where(eq(staff.id, id)).limit(1)
  if (!existing) {
    return fail(c, '员工不存在', 404)
  }

  const currentUserId = c.get('userId')
  const [currentStaff] = await db.select().from(staff).where(eq(staff.userId, currentUserId)).limit(1)
  if (currentStaff?.id === id) {
    return fail(c, '不能删除自己', 400)
  }

  const [{ n: orderCount }] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.userId, existing.userId))

  if (orderCount > 0) {
    return fail(c, `该员工有 ${orderCount} 条订单记录，无法永久删除`, 409)
  }

  db.transaction((tx) => {
    tx.delete(staff).where(eq(staff.id, id)).run()
    tx.delete(users).where(eq(users.id, existing.userId)).run()
  })

  return success(c, { id, hardDeleted: true })
})

export default app
