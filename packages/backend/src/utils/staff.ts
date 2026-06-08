import { db } from '../db'
import { staff, roles, rolePermissions, permissions, users } from '../db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import type { PermissionCode } from './permissions'

export interface StaffContext {
  isStaff: boolean
  roleId: number | null
  roleName: string | null
  permissions: PermissionCode[]
}

export async function loadStaffContext(userId: number): Promise<StaffContext> {
  const [row] = db
    .select({
      staffId: staff.id,
      status: staff.status,
      roleId: roles.id,
      roleName: roles.name
    })
    .from(staff)
    .innerJoin(roles, eq(staff.roleId, roles.id))
    .where(and(eq(staff.userId, userId), eq(staff.status, 'active')))
    .limit(1)
    .all()

  if (!row) {
    return { isStaff: false, roleId: null, roleName: null, permissions: [] }
  }

  const permRows = db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, row.roleId))
    .all()

  return {
    isStaff: true,
    roleId: row.roleId,
    roleName: row.roleName,
    permissions: permRows.map(p => p.code as PermissionCode)
  }
}

export async function getUserWithStaff(userId: number): Promise<{
  id: number
  email: string
  name: string
  role: 'customer' | 'admin'
  isStaff: boolean
  roleId: number | null
  roleName: string | null
  permissions: PermissionCode[]
} | null> {
  const [user] = db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .all()

  if (!user) return null

  const ctx = await loadStaffContext(userId)
  return { ...user, ...ctx }
}
