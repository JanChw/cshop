import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { createUser } from './helpers/factories'

describe('GET /auth/me', () => {
  test('returns current user info', async () => {
    const user = await createUser()
    const { status, body } = await api('/api/v1/auth/me', { token: user.accessToken })
    expect(status).toBe(200)
    expect(body.data.id).toBe(user.id)
    expect(body.data.email).toBe(user.email)
    expect(body.data.isStaff).toBe(false)
    expect(body.data.permissions).toEqual([])
  })

  test('requires authentication', async () => {
    const { status } = await api('/api/v1/auth/me')
    expect(status).toBe(401)
  })
})

describe('POST /auth/change-password', () => {
  test('changes password with correct old password', async () => {
    const user = await createUser({ password: 'oldpass123' })
    const { status } = await api('/api/v1/auth/change-password', {
      method: 'POST',
      token: user.accessToken,
      body: { oldPassword: 'oldpass123', newPassword: 'newpass456' }
    })
    expect(status).toBe(200)

    const login = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: user.email, password: 'newpass456' }
    })
    expect(login.status).toBe(200)
  })

  test('rejects wrong old password', async () => {
    const user = await createUser({ password: 'oldpass123' })
    const { status, body } = await api('/api/v1/auth/change-password', {
      method: 'POST',
      token: user.accessToken,
      body: { oldPassword: 'wrong', newPassword: 'newpass456' }
    })
    expect(status).toBe(400)
    expect(body.error).toContain('原密码错误')
  })

  test('requires authentication', async () => {
    const { status } = await api('/api/v1/auth/change-password', {
      method: 'POST',
      body: { oldPassword: 'x', newPassword: 'newpass456' }
    })
    expect(status).toBe(401)
  })
})

describe('POST /auth/logout-all', () => {
  test('revokes all sessions for current user', async () => {
    const user = await createUser()
    const { status } = await api('/api/v1/auth/logout-all', {
      method: 'POST',
      token: user.accessToken
    })
    expect(status).toBe(200)
  })

  test('requires authentication', async () => {
    const { status } = await api('/api/v1/auth/logout-all', { method: 'POST' })
    expect(status).toBe(401)
  })
})
