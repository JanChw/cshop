import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { sessions } from '../src/db/schema'
import { eq, isNull, isNotNull, and } from 'drizzle-orm'
import { signAccessToken, signRefreshToken } from '../src/utils/jwt'
import { createUser } from './helpers/factories'

describe('register', () => {
  test('creates a user, returns access + refresh + user', async () => {
    const { status, body } = await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'password123', name: 'Alice' }
    })
    expect(status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.user.email).toBe('a@b.com')
    expect(typeof body.data.accessToken).toBe('string')
    expect(typeof body.data.refreshToken).toBe('string')
  })

  test('rejects duplicate email', async () => {
    await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'dup@b.com', password: 'password123', name: 'A' }
    })
    const { status, body } = await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'dup@b.com', password: 'password123', name: 'B' }
    })
    expect(status).toBe(400)
    expect(body.error).toContain('已注册')
  })

  test('rejects short password', async () => {
    const { status } = await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'x@b.com', password: '123', name: 'X' }
    })
    expect(status).toBe(400)
  })
})

describe('login', () => {
  test('valid credentials return tokens', async () => {
    await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'l@b.com', password: 'password123', name: 'L' }
    })
    const { status, body } = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'l@b.com', password: 'password123' }
    })
    expect(status).toBe(200)
    expect(body.data.accessToken).toBeDefined()
  })

  test('wrong password 401', async () => {
    await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'w@b.com', password: 'password123', name: 'W' }
    })
    const { status } = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'w@b.com', password: 'wrongpass' }
    })
    expect(status).toBe(401)
  })

  test('non-existent email 401 (no enumeration)', async () => {
    const { status, body } = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'nope@b.com', password: 'password123' }
    })
    expect(status).toBe(401)
    expect(body.error).toContain('邮箱或密码错误')
  })

  test('login cleans up expired sessions for the user (B6)', async () => {
    const user = await createUser({ email: 'cleanup@b.com', password: 'password123' })
    // Insert an expired session manually
    await db.insert(sessions).values({
      userId: user.id,
      refreshToken: 'expired-token-' + Date.now(),
      expiresAt: new Date(Date.now() - 1000).toISOString()
    })

    const before = await db.select().from(sessions).where(eq(sessions.userId, user.id))
    expect(before.length).toBe(2)

    await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'cleanup@b.com', password: 'password123' }
    })

    const after = await db.select().from(sessions).where(eq(sessions.userId, user.id))
    // Old expired session removed, original active session kept, new session added.
    // So expected count: 2 (active original + new login session).
    expect(after.length).toBe(2)
    expect(after.every(s => new Date(s.expiresAt).getTime() > Date.now())).toBe(true)
  })
})

describe('JWT token typ separation (A2)', () => {
  test('refresh token cannot be used as access token', async () => {
    const user = await createUser()
    const { status } = await api('/api/v1/cart', {
      method: 'GET',
      token: user.refreshToken
    })
    expect(status).toBe(401)
  })

  test('access token cannot be used as refresh token', async () => {
    const user = await createUser()
    const { status } = await api('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: user.accessToken }
    })
    expect(status).toBe(401)
  })

  test('access token works for protected route', async () => {
    const user = await createUser()
    const { status } = await api('/api/v1/cart', {
      method: 'GET',
      token: user.accessToken
    })
    expect(status).toBe(200)
  })

  test('legacy token without typ is still accepted (backward compat)', async () => {
    // Simulate a pre-deploy token by signing without typ field.
    const jwt = (await import('jsonwebtoken')).default
    const user = await createUser()
    const legacyAccessToken = jwt.sign(
      { userId: user.id, isStaff: user.isStaff, roleId: user.roleId, roleName: user.roleName, permissions: user.permissions },
      'test-secret',
      { expiresIn: '15m' }
    )
    const { status } = await api('/api/v1/cart', {
      method: 'GET',
      token: legacyAccessToken
    })
    expect(status).toBe(200)
  })
})

describe('refresh', () => {
  test('valid refresh rotates tokens', async () => {
    const user = await createUser()
    const { status, body } = await api('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: user.refreshToken }
    })
    expect(status).toBe(200)
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    expect(body.data.refreshToken).not.toBe(user.refreshToken)
  })

  test('reusing a refresh token revokes the entire chain (A9)', async () => {
    const user = await createUser()

    // First refresh: succeeds.
    const r1 = await api('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: user.refreshToken }
    })
    expect(r1.status).toBe(200)
    const newRefresh = r1.body.data.refreshToken

    // Second refresh with the original (now revoked) token: must fail
    // AND revoke the active new session as a chain.
    const r2 = await api('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: user.refreshToken }
    })
    expect(r2.status).toBe(401)

    // The newly issued token from r1 should also be revoked now.
    const active = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)))
    expect(active.length).toBe(0)

    // And further use of the new refresh should fail too.
    const r3 = await api('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: newRefresh }
    })
    expect(r3.status).toBe(401)
  })

  test('expired or invalid refresh token 401', async () => {
    const { status } = await api('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: 'not-a-real-token' }
    })
    expect(status).toBe(401)
  })
})

describe('logout (A3)', () => {
  test('requires authentication', async () => {
    const { status } = await api('/api/v1/auth/logout', {
      method: 'POST',
      body: { refreshToken: 'any' }
    })
    expect(status).toBe(401)
  })

  test('cannot delete another user\'s session', async () => {
    const a = await createUser({ email: 'a@b.com' })
    const b = await createUser({ email: 'b@b.com' })

    // A tries to logout B's refresh token using A's access token.
    const { status } = await api('/api/v1/auth/logout', {
      method: 'POST',
      token: a.accessToken,
      body: { refreshToken: b.refreshToken }
    })
    expect(status).toBe(200) // operation 'succeeds' silently

    // But B's session must still exist.
    const bSessions = await db.select().from(sessions).where(eq(sessions.userId, b.id))
    expect(bSessions.length).toBe(1)
  })

  test('owner can logout own session', async () => {
    const u = await createUser()
    const { status } = await api('/api/v1/auth/logout', {
      method: 'POST',
      token: u.accessToken,
      body: { refreshToken: u.refreshToken }
    })
    expect(status).toBe(200)

    const remaining = await db.select().from(sessions).where(eq(sessions.refreshToken, u.refreshToken))
    expect(remaining.length).toBe(0)
  })
})

describe('JWT secret enforcement (A1)', () => {
  test('legacy default secret not used when JWT_SECRET is set in test env', () => {
    // The test setup explicitly sets JWT_SECRET=test-secret; verifying both
    // that signing works and that a token signed with the old hardcoded
    // dev secret would fail to verify.
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken')
    const t = signAccessToken({ userId: 1, isStaff: false, roleId: null, roleName: null, permissions: [] })
    expect(jwt.verify(t, 'test-secret')).toBeDefined()
    expect(() => jwt.verify(t, 'cshop-dev-secret')).toThrow()
    // signRefreshToken used to make sure import works
    expect(typeof signRefreshToken({ userId: 1 })).toBe('string')
    // suppress unused
    expect(isNotNull).toBeDefined()
  })
})
