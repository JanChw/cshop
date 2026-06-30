import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import type { PermissionCode } from './permissions'

let devSecretWarned = false

function getSecret(): string {
  const fromEnv = process.env.JWT_SECRET
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production')
  }
  // Dev fallback — print a loud warning once so a forgotten JWT_SECRET is
  // never silently used in a deployment that mistakenly stays in dev mode.
  if (!devSecretWarned) {
    devSecretWarned = true
    console.warn('[security] JWT_SECRET not set — using insecure dev-only fallback. NEVER deploy this to production.')
  }
  return 'cshop-dev-secret'
}

export type AccessPayload = {
  userId: number
  isStaff: boolean
  roleId: number | null
  roleName: string | null
  permissions: PermissionCode[]
  typ: 'access'
}

export type RefreshPayload = { userId: number; typ: 'refresh' }

export function signAccessToken(input: {
  userId: number
  isStaff: boolean
  roleId: number | null
  roleName: string | null
  permissions: PermissionCode[]
}, options?: { expiresIn?: string }): string {
  const payload: AccessPayload = {
    userId: input.userId,
    isStaff: input.isStaff,
    roleId: input.roleId,
    roleName: input.roleName,
    permissions: input.permissions,
    typ: 'access'
  }
  return jwt.sign(payload, getSecret(), { expiresIn: (options?.expiresIn || '15m') as any, jwtid: randomUUID() })
}

export function signRefreshToken(input: { userId: number }, options?: { expiresIn?: string }): string {
  const payload: RefreshPayload = { userId: input.userId, typ: 'refresh' }
  return jwt.sign(payload, getSecret(), { expiresIn: (options?.expiresIn || '7d') as any, jwtid: randomUUID() })
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as Partial<AccessPayload> & Partial<RefreshPayload>
    if (decoded.typ === 'refresh') return null
    if (typeof decoded.userId !== 'number') return null

    return {
      userId: decoded.userId,
      isStaff: decoded.isStaff === true,
      roleId: typeof decoded.roleId === 'number' ? decoded.roleId : null,
      roleName: typeof decoded.roleName === 'string' ? decoded.roleName : null,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions as PermissionCode[] : [],
      typ: 'access'
    }
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as Partial<AccessPayload> & Partial<RefreshPayload>
    if (decoded.typ === 'access') return null
    if (typeof decoded.userId !== 'number') return null
    return { userId: decoded.userId }
  } catch {
    return null
  }
}
