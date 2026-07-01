import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { users, sessions, orders, verificationCodes } from '../db/schema'
import { eq, and, lt, isNull, sql, desc } from 'drizzle-orm'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { success, fail } from '../utils/response'
import { auth } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { validateJson } from '../utils/validate'
import { mapDbError } from '../utils/dbError'
import { getClientIP } from '../utils/request'
import { config } from '../config'
import { registerSchema, loginSchema, refreshSchema, logoutSchema, changePasswordSchema, updateMeSchema, forgotPasswordSchema, deactivateAccountSchema, sendPhoneCodeSchema, bindPhoneSchema, sendEmailCodeSchema, emailCodeLoginSchema, activateEmailSchema, resendActivationSchema } from '../validators'
import { trackLogin, trackLogout, trackBusinessEvent } from '../utils/track'
import { loadStaffContext } from '../utils/staff'
import { checkLockout, recordFailure, recordSuccess, formatLockMessage, formatRemainingMessage, formatLockedWaitMessage } from '../utils/loginGuard'
import { sendNotification, sendEmail } from '../utils/notify'
import { getInt } from '../utils/settings'
import { verifyCaptcha } from '../utils/captcha'
import type { AppEnv } from '../types/hono'

const loginThrottle = rateLimit({ limit: 10, windowMs: 60_000 })
const registerThrottle = rateLimit({ limit: 5, windowMs: 60_000 })

const BCRYPT_COST = 10

async function cleanupExpiredSessions(userId: number): Promise<void> {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date().toISOString())))
}

async function issueTokensForUser(userId: number, rememberMe = true) {
  const staffCtx = await loadStaffContext(userId)
  const accessTtl = getInt('session_timeout', 15)
  const refreshTtl = rememberMe ? getInt('refresh_token_ttl', 7) : 1

  const accessToken = signAccessToken({
    userId,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  }, { expiresIn: `${accessTtl}m` })
  const refreshToken = signRefreshToken({ userId }, { expiresIn: `${refreshTtl}d` })

  await db.insert(sessions).values({
    userId,
    refreshToken,
    expiresAt: new Date(Date.now() + refreshTtl * 86400000).toISOString()
  })

  return { accessToken, refreshToken, isStaff: staffCtx.isStaff, roleId: staffCtx.roleId, roleName: staffCtx.roleName, permissions: staffCtx.permissions }
}

const app = new Hono<AppEnv>()

app.post('/register', registerThrottle, validateJson(registerSchema), async (c) => {
  const { email, password, name, captchaToken } = c.req.valid('json')

  const valid = await verifyCaptcha(captchaToken)
  if (!valid) return fail(c, '人机验证失败，请刷新后重试', 423)

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    return fail(c, '邮箱已注册')
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: BCRYPT_COST })
  let user
  try {
    [user] = await db.insert(users).values({ email, passwordHash, name }).returning()
  } catch (err) {
    const mapping = mapDbError(err)
    if (mapping.kind === 'unique') return fail(c, '邮箱已注册', mapping.status)
    console.error('[register] insert failed:', err)
    return fail(c, mapping.message, mapping.status)
  }

  trackBusinessEvent({ c, userId: user.id, eventType: 'register' })

  sendNotification(
    'user_register',
    '新用户注册',
    `${name} (${email}) 刚注册了账号`
  )

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString()
  await db.insert(verificationCodes).values({
    userId: user.id,
    purpose: 'email_activate',
    target: email,
    code: token,
    expiresAt
  })

  const link = `${config.appUrl}/auth/activate?token=${token}`
  const subject = '激活您的 CShop 账户'
  const body = [
    `您好，${name}：`,
    '',
    '感谢注册 CShop！请点击以下链接激活您的账户（30 分钟内有效）：',
    '',
    link,
    '',
    '如非本人操作，请忽略本邮件。'
  ].join('\n')
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;color:#1f1f1f">
<p>您好，${name}：</p>
<p>感谢注册 <strong>ByChooow</strong>！请点击下方按钮激活您的账户（30 分钟内有效）：</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr>
<td style="background:#6c5ce7;border-radius:8px;padding:12px 32px">
<a href="${link}" style="color:#fff;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">激活账户</a>
</td></tr></table>
<p style="color:#888;font-size:13px">如非本人操作，请忽略本邮件。</p>
</body></html>`

  void sendEmail({ to: email, subject, body, html, event: 'verification' }).catch((err) => {
    console.error('[EMAIL ACTIVATION]', err)
  })

  return success(c, { needsActivation: true, email }, 201)
})

app.post('/login', loginThrottle, validateJson(loginSchema), async (c) => {
  try {
    const { email, password, rememberMe = true } = c.req.valid('json')
    const ip = getClientIP(c)
    const userAgent = c.req.header('user-agent') ?? null

    const lockout = checkLockout(email)
    if (lockout.locked) {
      return fail(c, formatLockedWaitMessage(lockout.remainingMs), 423)
    }

    const [user] = db.select().from(users).where(eq(users.email, email)).limit(1).all()
    if (!user) {
      return fail(c, '邮箱或密码错误', 401)
    }

    if (user.status === 'disabled') {
      return fail(c, '账号已被禁用，请联系管理员', 403)
    }
    if (user.status === 'deactivated') {
      return fail(c, '账号已注销', 403)
    }

    if (!user.passwordHash) {
      return fail(c, '账号未设置密码，请使用找回密码功能', 400)
    }

    const valid = await Bun.password.verify(password, user.passwordHash, 'bcrypt')
    if (!valid) {
      const result = recordFailure(email, ip, userAgent)
      if (result.locked) {
        return fail(c, formatLockMessage(result.lockMinutes), 423)
      }
      return fail(c, formatRemainingMessage(result.remainingAttempts), 401)
    }

    recordSuccess(email, ip, userAgent)

    if (!user.emailVerifiedAt) {
      return fail(c, '邮箱未激活，请查收激活邮件或重新发送', 403)
    }

    await cleanupExpiredSessions(user.id)

    await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id))

    const tokens = await issueTokensForUser(user.id, rememberMe)

    trackLogin({ c, userId: user.id })

    return success(c, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
      isStaff: tokens.isStaff,
      roleId: tokens.roleId,
      roleName: tokens.roleName,
      permissions: tokens.permissions
    })
  } catch (err) {
    console.error('[login] unexpected error:', err)
    return fail(c, '服务器内部错误', 500)
  }
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
  const accessTtl = getInt('session_timeout', 15)
  const refreshTtl = getInt('refresh_token_ttl', 7)
  const newAccessToken = signAccessToken({
    userId: user.id,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  }, { expiresIn: `${accessTtl}m` })
  const newRefreshToken = signRefreshToken({ userId: user.id }, { expiresIn: `${refreshTtl}d` })

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: newRefreshToken,
    expiresAt: new Date(Date.now() + refreshTtl * 86400000).toISOString()
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
    .select({
      id: users.id, email: users.email, name: users.name,
      avatar: users.avatar, phone: users.phone, bio: users.bio,
      gender: users.gender, birthday: users.birthday, createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) {
    return fail(c, '用户不存在', 404)
  }
  const staffCtx = await loadStaffContext(userId)
  return success(c, {
    ...user,
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

  const allowedFields = ['name', 'email', 'avatar', 'phone', 'bio', 'gender', 'birthday'] as const
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (data[field as keyof typeof data] !== undefined) {
      updates[field] = data[field as keyof typeof data]
    }
  }

  if (Object.keys(updates).length === 0) {
    return fail(c, '至少修改一个字段')
  }

  await db.update(users).set(updates).where(eq(users.id, userId))
  return success(c, { id: userId, ...updates })
})

app.post('/account/deactivate', auth, validateJson(deactivateAccountSchema), async (c) => {
  const userId = c.get('userId')

  await db.update(users).set({ status: 'deactivated' }).where(eq(users.id, userId))

  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))

  return success(c, { id: userId, status: 'deactivated' })
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

  // Email-based password reset is not yet wired up (no token store / SMTP
  // reset template). Return a neutral message to avoid email enumeration
  // while staying honest that no link will be sent. Admins can reset via
  // /admin/users/:id/reset-password.
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (user) {
    console.log('[forgot-password] reset requested for user', user.id)
  }

  return success(c, { message: '密码自助重置暂未启用，请联系管理员重置密码' })
})

const phoneCodeThrottle = rateLimit({ limit: 3, windowMs: 60_000 })

// Send a 6-digit verification code to the user's registered email for phone binding.
app.post('/phone/send-code', auth, phoneCodeThrottle, validateJson(sendPhoneCodeSchema), async (c) => {
  const userId = c.get('userId')!
  const { phone } = c.req.valid('json')

  // Reject if phone already in use by another user.
  const [taken] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.phone, phone), sql`${users.id} != ${userId}`))
    .limit(1)
  if (taken) return fail(c, '该手机号已被其他账号绑定', 409)

  // Cooldown: an unused, unexpired code for same user+purpose within 60s.
  // SQLite stores datetime('now') as "YYYY-MM-DD HH:MM:SS" (space-separated, no Z).
  // Compare in the same format to avoid lexical-mismatch false negatives.
  const cooldownAt = new Date(Date.now() - 60_000).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
  const nowIso = new Date().toISOString()
  const [recent] = await db.select({ id: verificationCodes.id }).from(verificationCodes)
    .where(and(
      eq(verificationCodes.userId, userId),
      eq(verificationCodes.purpose, 'bind_phone'),
      isNull(verificationCodes.usedAt),
      sql`${verificationCodes.expiresAt} > ${nowIso}`,
      sql`${verificationCodes.createdAt} > ${cooldownAt}`
    ))
    .limit(1)
  if (recent) return fail(c, '验证码发送过于频繁，请 60 秒后重试', 429)

  const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return fail(c, '用户不存在', 404)

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()

  await db.insert(verificationCodes).values({
    userId,
    purpose: 'bind_phone',
    target: phone,
    code,
    expiresAt
  })

  const subject = 'CShop 手机绑定验证码'
  const body = [
    `您好，${user.name || '用户'}：`,
    '',
    `您正在为 CShop 账号绑定手机号 ${phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}。`,
    `验证码：${code}（10 分钟内有效，请勿泄露给他人）。`,
    '',
    '如非本人操作，请忽略本邮件。'
  ].join('\n')

  // sendEmail returns false on dev-fallback (SMTP unconfigured); we do not block the flow.
  void sendEmail({ to: user.email, subject, body, event: 'verification' }).catch((err) => {
    console.error('[PHONE BIND CODE EMAIL]', err)
  })

  return success(c, { message: '验证码已发送至注册邮箱' })
})

// Verify the code and bind the phone number to the current user.
app.post('/phone/bind', auth, validateJson(bindPhoneSchema), async (c) => {
  const userId = c.get('userId')!
  const { phone, code } = c.req.valid('json')

  // Re-check uniqueness at bind time (race protection).
  const [taken] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.phone, phone), sql`${users.id} != ${userId}`))
    .limit(1)
  if (taken) return fail(c, '该手机号已被其他账号绑定', 409)

  const [row] = await db.select().from(verificationCodes)
    .where(and(
      eq(verificationCodes.userId, userId),
      eq(verificationCodes.purpose, 'bind_phone'),
      eq(verificationCodes.target, phone),
      isNull(verificationCodes.usedAt)
    ))
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1)

  if (!row) return fail(c, '请先获取验证码', 400)
  if (new Date(row.expiresAt).getTime() < Date.now()) return fail(c, '验证码已过期，请重新获取', 400)
  if (row.attempts >= 5) return fail(c, '尝试次数过多，请重新获取验证码', 400)

  if (row.code !== code) {
    await db.update(verificationCodes).set({ attempts: row.attempts + 1 }).where(eq(verificationCodes.id, row.id))
    return fail(c, '验证码错误', 400)
  }

  await db.update(verificationCodes).set({ usedAt: new Date().toISOString() }).where(eq(verificationCodes.id, row.id))
  await db.update(users).set({ phone }).where(eq(users.id, userId))

  return success(c, { phone })
})

const emailCodeSendThrottle = rateLimit({ limit: 3, windowMs: 60_000 })

app.post('/email/send-code', emailCodeSendThrottle, validateJson(sendEmailCodeSchema), async (c) => {
  const { email, captchaToken } = c.req.valid('json')

  const valid = await verifyCaptcha(captchaToken)
  if (!valid) return fail(c, '人机验证失败，请刷新后重试', 423)

  const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1)

  if (user) {
    const cooldownAt = new Date(Date.now() - 60_000).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
    const nowIso = new Date().toISOString()
    const [recent] = await db.select({ id: verificationCodes.id }).from(verificationCodes)
      .where(and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.purpose, 'email_login'),
        isNull(verificationCodes.usedAt),
        sql`${verificationCodes.expiresAt} > ${nowIso}`,
        sql`${verificationCodes.createdAt} > ${cooldownAt}`
      ))
      .limit(1)
    if (recent) return fail(c, '验证码发送过于频繁，请 60 秒后重试', 429)

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()

    await db.insert(verificationCodes).values({
      userId: user.id,
      purpose: 'email_login',
      target: email,
      code,
      expiresAt
    })

    const subject = 'CShop 邮箱验证码登录'
    const body = [
      `您好，${user.name || '用户'}：`,
      '',
      `您正在尝试登录 CShop，验证码：${code}（10 分钟内有效，请勿泄露给他人）。`,
      '',
      '如非本人操作，请忽略本邮件。'
    ].join('\n')

    void sendEmail({ to: email, subject, body, event: 'verification' }).catch((err) => {
      console.error('[EMAIL LOGIN CODE]', err)
    })
  }

  return success(c, { message: '验证码已发送至您的邮箱' })
})

app.post('/email/code-login', validateJson(emailCodeLoginSchema), async (c) => {
  const { email, code } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return fail(c, '邮箱或验证码错误', 401)
  }

  if (user.status === 'disabled') {
    return fail(c, '账号已被禁用，请联系管理员', 403)
  }
  if (user.status === 'deactivated') {
    return fail(c, '账号已注销', 403)
  }

  const [row] = await db.select().from(verificationCodes)
    .where(and(
      eq(verificationCodes.userId, user.id),
      eq(verificationCodes.purpose, 'email_login'),
      eq(verificationCodes.target, email),
      isNull(verificationCodes.usedAt)
    ))
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1)

  if (!row) return fail(c, '请先获取验证码', 400)
  if (new Date(row.expiresAt).getTime() < Date.now()) return fail(c, '验证码已过期，请重新获取', 400)
  if (row.attempts >= 5) return fail(c, '尝试次数过多，请重新获取验证码', 400)

  if (row.code !== code) {
    await db.update(verificationCodes).set({ attempts: row.attempts + 1 }).where(eq(verificationCodes.id, row.id))
    return fail(c, '验证码错误', 400)
  }

  await db.update(verificationCodes).set({ usedAt: new Date().toISOString() }).where(eq(verificationCodes.id, row.id))

  if (!user.emailVerifiedAt) {
    return fail(c, '邮箱未激活，请先激活邮箱后再登录', 403)
  }

  await cleanupExpiredSessions(user.id)
  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id))

  const tokens = await issueTokensForUser(user.id)

  trackLogin({ c, userId: user.id })

  return success(c, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
    isStaff: tokens.isStaff,
    roleId: tokens.roleId,
    roleName: tokens.roleName,
    permissions: tokens.permissions
  })
})

const activationThrottle = rateLimit({ limit: 5, windowMs: 60_000 })

app.post('/email/resend-activation', activationThrottle, validateJson(resendActivationSchema), async (c) => {
  const { email, captchaToken } = c.req.valid('json')

  const valid = await verifyCaptcha(captchaToken)
  if (!valid) return fail(c, '人机验证失败，请刷新后重试', 423)

  const [user] = await db.select({ id: users.id, name: users.name, emailVerifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return success(c, { sent: true })
  }

  if (user.emailVerifiedAt) {
    return fail(c, '邮箱已激活，无需重新发送', 400)
  }

  const cooldownAt = new Date(Date.now() - 60_000).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
  const nowIso = new Date().toISOString()
  const [recent] = await db.select({ id: verificationCodes.id }).from(verificationCodes)
    .where(and(
      eq(verificationCodes.userId, user.id),
      eq(verificationCodes.purpose, 'email_activate'),
      isNull(verificationCodes.usedAt),
      sql`${verificationCodes.expiresAt} > ${nowIso}`,
      sql`${verificationCodes.createdAt} > ${cooldownAt}`
    ))
    .limit(1)
  if (recent) return fail(c, '发送过于频繁，请 60 秒后重试', 429)

  await db.update(verificationCodes).set({ usedAt: new Date().toISOString() }).where(
    and(eq(verificationCodes.userId, user.id), eq(verificationCodes.purpose, 'email_activate'), isNull(verificationCodes.usedAt))
  )

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString()
  await db.insert(verificationCodes).values({
    userId: user.id,
    purpose: 'email_activate',
    target: email,
    code: token,
    expiresAt
  })

  const link = `${config.appUrl}/auth/activate?token=${token}`
  const subject = '重新激活您的 CShop 账户'
  const body = [
    `您好，${user.name || '用户'}：`,
    '',
    '请点击以下链接重新激活您的 CShop 账户（30 分钟内有效）：',
    '',
    link,
    '',
    '如非本人操作，请忽略本邮件。'
  ].join('\n')
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;color:#1f1f1f">
<p>您好，${user.name || '用户'}：</p>
<p>请点击下方按钮重新激活您的 <strong>ByChooow</strong> 账户（30 分钟内有效）：</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr>
<td style="background:#6c5ce7;border-radius:8px;padding:12px 32px">
<a href="${link}" style="color:#fff;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">重新激活账户</a>
</td></tr></table>
<p style="color:#888;font-size:13px">如非本人操作，请忽略本邮件。</p>
</body></html>`

  void sendEmail({ to: email, subject, body, html, event: 'verification' }).catch((err) => {
    console.error('[EMAIL RESEND ACTIVATION]', err)
  })

  return success(c, { sent: true })
})

app.post('/email/activate', validateJson(activateEmailSchema), async (c) => {
  const { token } = c.req.valid('json')

  const [row] = await db.select({
    id: verificationCodes.id,
    userId: verificationCodes.userId,
    expiresAt: verificationCodes.expiresAt
  }).from(verificationCodes)
    .where(and(
      eq(verificationCodes.code, token),
      eq(verificationCodes.purpose, 'email_activate'),
      isNull(verificationCodes.usedAt)
    ))
    .limit(1)

  if (!row) return fail(c, '激活链接无效或已过期，请重新发送', 400)
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await db.update(verificationCodes).set({ usedAt: new Date().toISOString() }).where(eq(verificationCodes.id, row.id))
    return fail(c, '激活链接已过期，请重新发送', 400)
  }

  await db.update(verificationCodes).set({ usedAt: new Date().toISOString() }).where(eq(verificationCodes.id, row.id))
  await db.update(users).set({ emailVerifiedAt: new Date().toISOString() }).where(eq(users.id, row.userId))

  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, row.userId)).limit(1)

  return success(c, { activated: true, email: user.email })
})

export default app
