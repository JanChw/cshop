import { createMiddleware } from 'hono/factory'
import { fail } from '../utils/response'
import { loadStaffContext } from '../utils/staff'
import type { AppEnv } from '../types/hono'
import type { PermissionCode } from '../utils/permissions'

// Requires the user to be an active staff member.
// loadStaffContext already filters by status='active' and caches for 30s.
export const requireStaff = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return fail(c, '未登录', 401)
  }
  const ctx = await loadStaffContext(userId)

  if (!ctx.isStaff) {
    return fail(c, '无权限', 403)
  }

  c.set('isStaff', true)
  c.set('roleId', ctx.roleId)
  c.set('roleName', ctx.roleName)
  c.set('permissions', ctx.permissions)

  await next()
})

// Factory: returns a middleware that requires a specific permission code.
// If user lacks it, returns 403 with a clear message.
export function requirePermission(code: PermissionCode) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const perms = c.get('permissions') ?? []
    if (!perms.includes(code)) {
      return fail(c, `无权限：需要 ${code}`, 403)
    }
    await next()
  })
}

// Convenience: require ANY of the given permission codes.
export function requireAnyPermission(...codes: PermissionCode[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const perms = c.get('permissions') ?? []
    const has = codes.some(code => perms.includes(code))
    if (!has) {
      return fail(c, `无权限：需要 ${codes.join(' / ')}`, 403)
    }
    await next()
  })
}
