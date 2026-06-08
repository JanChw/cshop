import { Hono } from 'hono'
import { db } from '../../db'
import { roles, permissions, rolePermissions, staff } from '../../db/schema'
import { eq, asc, inArray, and, count } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { z } from 'zod'
import type { AppEnv } from '../../types/hono'

const createRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, '角色标识只能用小写字母、数字和下划线'),
  displayName: z.string().min(1),
  description: z.string().optional()
})

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive())
})

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('staff.read'), async (c) => {
  const allRoles = db.select().from(roles).orderBy(asc(roles.id)).all()

  const rolePerms = db
    .select({
      roleId: rolePermissions.roleId,
      permissionId: rolePermissions.permissionId,
      code: permissions.code,
      module: permissions.module,
      description: permissions.description
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .all()

  const grouped = new Map<number, Array<{ id: number; code: string; module: string; description: string | null }>>()
  for (const rp of rolePerms) {
    if (!grouped.has(rp.roleId)) grouped.set(rp.roleId, [])
    grouped.get(rp.roleId)!.push({
      id: rp.permissionId,
      code: rp.code,
      module: rp.module,
      description: rp.description
    })
  }

  const items = allRoles.map(r => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description,
    isSystem: r.isSystem,
    permissions: grouped.get(r.id) ?? []
  }))

  return success(c, { items })
})

app.get('/permissions', requirePermission('staff.read'), async (c) => {
  const items = db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.id)).all()
  return success(c, { items })
})

app.put('/:id/permissions', requirePermission('staff.create'), validateJson(updatePermissionsSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  if (!role) {
    return fail(c, '角色不存在', 404)
  }
  if (role.isSystem) {
    return fail(c, '系统角色权限不可修改', 403)
  }

  if (data.permissionIds.length > 0) {
    const validPerms = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.id, data.permissionIds))
    if (validPerms.length !== data.permissionIds.length) {
      return fail(c, '包含无效权限ID', 400)
    }
  }

  db.transaction((tx) => {
    tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id)).run()
    if (data.permissionIds.length > 0) {
      for (const permId of data.permissionIds) {
        tx.insert(rolePermissions).values({ roleId: id, permissionId: permId }).run()
      }
    }
  })

  return success(c, null)
})

app.post('/', requirePermission('staff.create'), validateJson(createRoleSchema), async (c) => {
  const data = c.req.valid('json')

  const [existing] = db.select({ id: roles.id }).from(roles).where(eq(roles.name, data.name)).limit(1).all()
  if (existing) {
    return fail(c, '角色标识已存在', 409)
  }

  const [record] = db.insert(roles).values({
    name: data.name,
    displayName: data.displayName,
    description: data.description ?? null,
    isSystem: false
  }).returning().all()

  return success(c, record, 201)
})

app.delete('/:id', requirePermission('staff.create'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [role] = db.select().from(roles).where(eq(roles.id, id)).limit(1).all()
  if (!role) {
    return fail(c, '角色不存在', 404)
  }
  if (role.isSystem) {
    return fail(c, '系统角色不可删除', 403)
  }

  const [ref] = db.select({ n: count() }).from(staff).where(eq(staff.roleId, id)).all()
  if ((ref?.n ?? 0) > 0) {
    return fail(c, `该角色下还有 ${ref.n} 名员工，无法删除`, 409)
  }

  db.transaction((tx) => {
    tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id)).run()
    tx.delete(roles).where(eq(roles.id, id)).run()
  })

  return success(c, null)
})

export default app
