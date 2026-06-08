import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { settings, activityEvents, users } from '../src/db/schema'
import { createUser, createStaff } from './helpers/factories'
import { flush } from '../src/utils/eventQueue'

describe('GET /admin/settings', () => {
  test('returns default settings', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/settings', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.activity_retention_days).toBe('30')
  })
})

describe('PUT /admin/settings', () => {
  test('updates activity_retention_days', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/settings', {
      method: 'PUT',
      token: admin.accessToken,
      body: { activity_retention_days: '60' }
    })
    expect(status).toBe(200)
    expect(body.data.activity_retention_days).toBe('60')
  })

  test('persists settings across reads', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    await api('/api/v1/admin/settings', {
      method: 'PUT',
      token: admin.accessToken,
      body: { activity_retention_days: '90' }
    })
    const { body } = await api('/api/v1/admin/settings', { token: admin.accessToken })
    expect(body.data.activity_retention_days).toBe('90')
  })
})

describe('GET /admin/analytics/online', () => {
  test('returns online users list', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/online', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.data.total).toBe('number')
    expect(Array.isArray(body.data.users)).toBe(true)
  })
})

describe('GET /admin/analytics/events', () => {
  test('returns paginated events', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/events', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.data.total).toBe('number')
    expect(Array.isArray(body.data.items)).toBe(true)
  })

  test('filters by deviceType', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/events?deviceType=desktop', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })

  test('filters by country', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/events?country=CN', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })
})

describe('GET /admin/analytics/summary', () => {
  test('returns summary stats with default period', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/summary', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.data.dau).toBe('number')
    expect(typeof body.data.pv).toBe('number')
    expect(Array.isArray(body.data.topProducts)).toBe(true)
    expect(body.data.funnel).toBeDefined()
    expect(Array.isArray(body.data.deviceDistribution)).toBe(true)
    expect(Array.isArray(body.data.trend)).toBe(true)
  })

  test('supports period=7d', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/summary?period=7d', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })

  test('supports period=30d', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/summary?period=30d', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })
})

describe('GET /admin/analytics/geo', () => {
  test('returns geo distribution with city level', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/geo', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.byCountry)).toBe(true)
    expect(Array.isArray(body.data.byRegion)).toBe(true)
    expect(Array.isArray(body.data.byCity)).toBe(true)
  })
})

describe('GET /admin/analytics/audit', () => {
  test('returns admin action events', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/audit', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.data.total).toBe('number')
    expect(Array.isArray(body.data.items)).toBe(true)
  })
})

describe('GET /admin/analytics/retention', () => {
  test('returns empty without cohortDate', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/analytics/retention', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.data.cohort).toBeNull()
    expect(Array.isArray(body.data.retention)).toBe(true)
  })

  test('returns retention data with cohortDate', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    await api('/api/v1/cart', { method: 'GET', token: admin.accessToken })
    await flush()

    const today = new Date().toISOString().split('T')[0]
    const { status, body } = await api(`/api/v1/admin/analytics/retention?cohortDate=${today}`, { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.data.cohort).toBeDefined()
    expect(body.data.cohort.date).toBe(today)
    expect(body.data.cohort.size).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(body.data.retention)).toBe(true)
    if (body.data.cohort.size > 0) {
      expect(body.data.retention.length).toBe(8)
      expect(body.data.retention[0].day).toBe(0)
      expect(body.data.retention[0].rate).toBeGreaterThanOrEqual(0)
    }
  })
})
