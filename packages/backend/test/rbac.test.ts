import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { roles } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { createStaff, createUser } from './helpers/factories'

describe('RBAC enforcement', () => {
  test('non-staff user gets 403 on admin endpoint', async () => {
    const customer = await createUser({})
    const { status, body } = await api('/api/v1/admin/dashboard', { token: customer.accessToken })
    expect(status).toBe(403)
    expect(body.error).toContain('无权限')
  })

  test('unauthenticated request gets 401', async () => {
    const { status, body } = await api('/api/v1/admin/dashboard')
    expect(status).toBe(401)
  })

  test('staff without required permission gets 403', async () => {
    const orderMgr = await createStaff({ roleName: 'order_mgr' })
    const { status, body } = await api('/api/v1/admin/products', { token: orderMgr.accessToken })
    expect(status).toBe(403)
    expect(body.error).toContain('无权限')
  })

  test('order_mgr can read orders', async () => {
    const orderMgr = await createStaff({ roleName: 'order_mgr' })
    const { status } = await api('/api/v1/admin/orders', { token: orderMgr.accessToken })
    expect(status).toBe(200)
  })

  test('order_mgr cannot create products', async () => {
    const orderMgr = await createStaff({ roleName: 'order_mgr' })
    const { status } = await api('/api/v1/admin/products', {
      method: 'POST',
      token: orderMgr.accessToken,
      body: { name: 'X', basePrice: 10, stock: 1 }
    })
    expect(status).toBe(403)
  })

  test('product_mgr can create products', async () => {
    const productMgr = await createStaff({ roleName: 'product_mgr' })
    const { status } = await api('/api/v1/admin/products', {
      method: 'POST',
      token: productMgr.accessToken,
      body: { name: 'New Product', basePrice: 50, stock: 10 }
    })
    expect(status).toBe(201)
  })

  test('analytics_viewer can read analytics but cannot create products', async () => {
    const viewer = await createStaff({ roleName: 'analytics_viewer' })

    const summary = await api('/api/v1/admin/analytics/summary', { token: viewer.accessToken })
    expect(summary.status).toBe(200)

    const create = await api('/api/v1/admin/products', {
      method: 'POST',
      token: viewer.accessToken,
      body: { name: 'X', basePrice: 10 }
    })
    expect(create.status).toBe(403)
  })

  test('super_admin has all permissions', async () => {
    const superAdmin = await createStaff({ roleName: 'super_admin' })
    expect(superAdmin.permissions).toContain('product.create')
    expect(superAdmin.permissions).toContain('order.read')
    expect(superAdmin.permissions).toContain('staff.create')
  })

  test('suspended staff gets 403', async () => {
    const suspended = await createStaff({ roleName: 'product_mgr', status: 'suspended' })
    const { status } = await api('/api/v1/admin/dashboard', { token: suspended.accessToken })
    expect(status).toBe(403)
  })
})

describe('Staff CRUD', () => {
  test('super_admin can create staff', async () => {
    const superAdmin = await createStaff({ roleName: 'super_admin' })
    const [productMgrRole] = db.select().from(roles).where(eq(roles.name, 'product_mgr')).limit(1).all()
    const { status, body } = await api('/api/v1/admin/staff', {
      method: 'POST',
      token: superAdmin.accessToken,
      body: {
        email: 'newstaff@test.local',
        password: 'password123',
        name: 'New Staff',
        roleId: productMgrRole.id
      }
    })
    expect(status).toBe(201)
    expect(body.data.email).toBe('newstaff@test.local')
  })

  test('product_mgr cannot create staff', async () => {
    const productMgr = await createStaff({ roleName: 'product_mgr' })
    const [orderMgrRole] = db.select().from(roles).where(eq(roles.name, 'order_mgr')).limit(1).all()
    const { status } = await api('/api/v1/admin/staff', {
      method: 'POST',
      token: productMgr.accessToken,
      body: {
        email: 'x@test.local',
        password: 'password123',
        name: 'X',
        roleId: orderMgrRole.id
      }
    })
    expect(status).toBe(403)
  })

  test('cannot delete self', async () => {
    const superAdmin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api(`/api/v1/admin/staff/${superAdmin.staffId}`, {
      method: 'DELETE',
      token: superAdmin.accessToken
    })
    expect(status).toBe(400)
    expect(body.error).toContain('不能删除自己')
  })
})

describe('Role management', () => {
  test('staff.read can list roles with permissions', async () => {
    const superAdmin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/roles', { token: superAdmin.accessToken })
    expect(status).toBe(200)
    expect(body.data.items.length).toBeGreaterThanOrEqual(4)
    const productMgr = body.data.items.find((r: any) => r.name === 'product_mgr')
    expect(productMgr.permissions.length).toBeGreaterThan(0)
  })

  test('system role permissions cannot be modified', async () => {
    const superAdmin = await createStaff({ roleName: 'super_admin' })
    const superAdminRole = (await api('/api/v1/admin/roles', { token: superAdmin.accessToken })).body.data.items.find((r: any) => r.name === 'super_admin')

    const { status, body } = await api(`/api/v1/admin/roles/${superAdminRole.id}/permissions`, {
      method: 'PUT',
      token: superAdmin.accessToken,
      body: { permissionIds: [] }
    })
    expect(status).toBe(403)
    expect(body.error).toContain('系统角色')
  })
})
