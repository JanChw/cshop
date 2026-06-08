import { Hono } from 'hono'
import { db } from '../db'
import { users, sessions, orders } from '../db/schema'
import { eq, and, lt, isNull, sql, desc } from 'drizzle-orm'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { success, fail } from '../utils/response'
import { auth } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { validateJson } from '../utils/validate'
import { registerSchema, loginSchema, refreshSchema, logoutSchema, changePasswordSchema, updateMeSchema, forgotPasswordSchema } from '../validators'
import { trackLogin, trackLogout, trackBusinessEvent } from '../utils/track'
import { loadStaffContext } from '../utils/staff'
import type { AppEnv } from '../types/hono'

const loginThrottle = rateLimit({ limit: 10, windowMs: 60_000 })
const registerThrottle = rateLimit({ limit: 5, windowMs: 60_000 })

const REFRESH_TTL_MS = 7 * 24 * 3600 * 1000
const BCRYPT_COST = 10

function refreshExpiry(): string {
  return new Date(Date.now() + REFRESH_TTL_MS).toISOString()
}

async function cleanupExpiredSessions(userId: number): Promise<void> {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date().toISOString())))
}

async function issueTokensForUser(userId: number, role: 'customer' | 'admin') {
  const staffCtx = await loadStaffContext(userId)
  const accessToken = signAccessToken({
    userId,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  })
  const refreshToken = signRefreshToken({ userId })

  await db.insert(sessions).values({
    userId,
    refreshToken,
    expiresAt: refreshExpiry()
  })

  return { accessToken, refreshToken, isStaff: staffCtx.isStaff, roleId: staffCtx.roleId, roleName: staffCtx.roleName, permissions: staffCtx.permissions, legacyRole: role }
}

const app = new Hono<AppEnv>()

app.post('/register', registerThrottle, validateJson(registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    return fail(c, '邮箱已注册')
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: BCRYPT_COST })
  const [user] = await db.insert(users).values({ email, passwordHash, name }).returning()

  trackBusinessEvent({ c, userId: user.id, eventType: 'register' })

  const tokens = await issueTokensForUser(user.id, user.role)
  return success(c, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    isStaff: tokens.isStaff,
    roleId: tokens.roleId,
    roleName: tokens.roleName,
    permissions: tokens.permissions
  }, 201)
})

app.post('/login', loginThrottle, validateJson(loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return fail(c, '邮箱或密码错误', 401)
  }

  const valid = await Bun.password.verify(password, user.passwordHash, 'bcrypt')
  if (!valid) {
    return fail(c, '邮箱或密码错误', 401)
  }

  await cleanupExpiredSessions(user.id)

  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id))

  const tokens = await issueTokensForUser(user.id, user.role)

  trackLogin({ c, userId: user.id })

  return success(c, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    isStaff: tokens.isStaff,
    roleId: tokens.roleId,
    roleName: tokens.roleName,
    permissions: tokens.permissions
  })
})

app.post('/refresh', validateJson(refreshSchema), async (c) => {
  const { refreshToken: providedToken } = c.req.valid('json')
  const payload = verifyRefreshToken(providedToken)
  if (!payload) {
    return fail(c, 'refreshToken 无效或已过期', 401)
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, providedToken))
    .limit(1)

  if (!session || session.userId !== payload.userId) {
    return fail(c, 'session 不存在', 401)
  }

  if (session.revokedAt !== null) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(sessions.userId, payload.userId), isNull(sessions.revokedAt)))
    return fail(c, 'refreshToken 已被撤销，请重新登录', 401)
  }

  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(sessions.id, session.id))

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
  if (!user) {
    return fail(c, '用户不存在', 401)
  }

  const staffCtx = await loadStaffContext(user.id)
  const newAccessToken = signAccessToken({
    userId: user.id,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  })
  const newRefreshToken = signRefreshToken({ userId: user.id })

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: newRefreshToken,
    expiresAt: refreshExpiry()
  })

  await cleanupExpiredSessions(user.id)

  return success(c, { accessToken: newAccessToken, refreshToken: newRefreshToken })
})

app.post('/logout', auth, validateJson(logoutSchema), async (c) => {
  const userId = c.get('userId')
  const { refreshToken } = c.req.valid('json')

  await db
    .delete(sessions)
    .where(and(
      eq(sessions.refreshToken, refreshToken),
      eq(sessions.userId, userId)
    ))

  trackLogout({ userId })

  return success(c, null)
})

app.post('/logout-all', auth, async (c) => {
  const userId = c.get('userId')
  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
  return success(c, null)
})

app.get('/me', auth, async (c) => {
  const userId = c.get('userId')
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) {
    return fail(c, '用户不存在', 404)
  }
  const staffCtx = await loadStaffContext(userId)
  return success(c, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  })
})

app.post('/change-password', auth, validateJson(changePasswordSchema), async (c) => {
  const userId = c.get('userId')
  const { oldPassword, newPassword } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    return fail(c, '用户不存在', 404)
  }

  const valid = await Bun.password.verify(oldPassword, user.passwordHash, 'bcrypt')
  if (!valid) {
    return fail(c, '原密码错误', 400)
  }

  const newHash = await Bun.password.hash(newPassword, { algorithm: 'bcrypt', cost: BCRYPT_COST })
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId))

  // Revoke all OTHER sessions (not the one making this request).
  // The current session's refreshToken can be passed via X-Current-Refresh-Token
  // header; if absent, all sessions are revoked and the user must log in again.
  const providedToken = c.req.header('X-Current-Refresh-Token')
  if (providedToken) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        sql`${sessions.refreshToken} != ${providedToken}`
      ))
  } else {
    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
  }

  return success(c, null)
})

app.patch('/me', auth, validateJson(updateMeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  if (data.email) {
    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1)
    if (exists && exists.id !== userId) {
      return fail(c, '邮箱已被其他用户使用', 409)
    }
  }

  const updates: Partial<{ name: string; email: string }> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.email !== undefined) updates.email = data.email

  await db.update(users).set(updates).where(eq(users.id, userId))
  return success(c, { id: userId, ...updates })
})

app.delete('/me', auth, async (c) => {
  const userId = c.get('userId')

  const [orderCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.userId, userId))

  if ((orderCount?.n ?? 0) > 0) {
    await db.update(users).set({ disabled: true }).where(eq(users.id, userId))
    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    return success(c, { id: userId, softDeleted: true })
  }

  await db.delete(sessions).where(eq(sessions.userId, userId))
  await db.delete(users).where(eq(users.id, userId))
  return success(c, { id: userId, softDeleted: false })
})

app.get('/sessions', auth, async (c) => {
  const userId = c.get('userId')
  const rows = await db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      revokedAt: sessions.revokedAt
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt))

  return success(c, rows)
})

app.delete('/sessions/:id', auth, async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
  return success(c, null)
})

app.post('/forgot-password', rateLimit({ limit: 5, windowMs: 60_000 }), validateJson(forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json')

  // Always return success to avoid email enumeration.
  // In production, send a reset link via email; for now, log only.
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (user) {
    console.log(`[forgot-password] reset link would be sent to ${email} for user ${user.id}`)
  }

  return success(c, { message: '如果该邮箱已注册，重置链接将很快送达' })
})

export default app
