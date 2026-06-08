import { createMiddleware } from 'hono/factory'
import { verifyAccessToken } from '../utils/jwt'
import { fail } from '../utils/response'
import { loadStaffContext } from '../utils/staff'
import type { AppEnv } from '../types/hono'

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return fail(c, '未登录', 401)
  }
  const payload = verifyAccessToken(header.slice(7))
  if (!payload) {
    return fail(c, '登录已过期', 401)
  }

  c.set('userId', payload.userId)
  c.set('isStaff', payload.isStaff)
  c.set('roleId', payload.roleId)
  c.set('roleName', payload.roleName)
  c.set('permissions', payload.permissions)

  await next()
})

// Optional auth: sets context if a valid token is present, otherwise continues.
// Used by routes that personalize for logged-in users but don't require auth.
export const authOptional = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (header?.startsWith('Bearer ')) {
    const payload = verifyAccessToken(header.slice(7))
    if (payload) {
      c.set('userId', payload.userId)
      c.set('isStaff', payload.isStaff)
      c.set('roleId', payload.roleId)
      c.set('roleName', payload.roleName)
      c.set('permissions', payload.permissions)
    }
  }
  await next()
})
