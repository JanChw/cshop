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

// 30s in-memory cache so every admin request doesn't hit the DB twice for
// staff/role/permission lookup. Cleared on role/staff mutation via
// invalidateStaffCache(userId).
const STAFF_CACHE_TTL_MS = 30_000
interface StaffCacheEntry {
  ctx: StaffContext
  loadedAt: number
}
const staffCache = new Map<number, StaffCacheEntry>()

export function invalidateStaffCache(userId?: number): void {
  if (userId !== undefined) staffCache.delete(userId)
  else staffCache.clear()
}

export async function loadStaffContext(userId: number): Promise<StaffContext> {
  const now = Date.now()
  const cached = staffCache.get(userId)
  if (cached && now - cached.loadedAt < STAFF_CACHE_TTL_MS) {
    return cached.ctx
  }

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
    const ctx: StaffContext = { isStaff: false, roleId: null, roleName: null, permissions: [] }
    staffCache.set(userId, { ctx, loadedAt: now })
    return ctx
  }

  const permRows = db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, row.roleId))
    .all()

  const ctx: StaffContext = {
    isStaff: true,
    roleId: row.roleId,
    roleName: row.roleName,
    permissions: permRows.map(p => p.code as PermissionCode)
  }
  staffCache.set(userId, { ctx, loadedAt: now })
  return ctx
}

export async function getUserWithStaff(userId: number): Promise<{
  id: number
  email: string
  name: string
  isStaff: boolean
  roleId: number | null
  roleName: string | null
  permissions: PermissionCode[]
} | null> {
  const [user] = db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .all()

  if (!user) return null

  const ctx = await loadStaffContext(userId)
  return { ...user, ...ctx }
}
