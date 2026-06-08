import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { orders } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { createUser, createProduct, createVariant, createCategory, addCartItem, createStaff } from './helpers/factories'

describe('dashboard (B1)', () => {
  test('counts and revenue computed via SQL aggregation', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })

    await createProduct({ name: 'P1' })
    await createProduct({ name: 'P2' })
    await createProduct({ name: 'P3' })

    const customer = await createUser({ email: 'c@b.com' })
    const p = await createProduct({ stock: 100 })
    await addCartItem(customer.id, p.id)
    const r1 = await api('/api/v1/orders', { method: 'POST', token: customer.accessToken, body: { address: 'x' } })
    await addCartItem(customer.id, p.id)
    const r2 = await api('/api/v1/orders', { method: 'POST', token: customer.accessToken, body: { address: 'y' } })

    // Mark r1 completed (revenue), leave r2 pending.
    await db.update(orders).set({ status: 'completed', total: 100 }).where(eq(orders.id, r1.body.data.id))
    await db.update(orders).set({ status: 'pending', total: 50 }).where(eq(orders.id, r2.body.data.id))

    const { status, body } = await api('/api/v1/admin/dashboard', { token: admin.accessToken })
    expect(status).toBe(200)
    expect(body.data.productCount).toBe(4) // P1, P2, P3, p
    expect(body.data.orderCount).toBe(2)
    expect(body.data.pendingCount).toBe(1) // not 0/1 hack
    expect(body.data.totalRevenue).toBe(100)
  })

  test('non-admin gets 403', async () => {
    const u = await createUser()
    const { status } = await api('/api/v1/admin/dashboard', { token: u.accessToken })
    expect(status).toBe(403)
  })
})

describe('admin product CRUD', () => {
  test('create returns the new record (C7)', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/products', {
      method: 'POST',
      token: admin.accessToken,
      body: { name: 'Newie', basePrice: 12.5, stock: 0 }
    })
    expect(status).toBe(201)
    expect(body.data.id).toBeDefined()
    expect(body.data.name).toBe('Newie')
  })

  test('update non-existent product returns 404', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status } = await api('/api/v1/admin/products/99999', {
      method: 'PUT',
      token: admin.accessToken,
      body: { name: 'X', basePrice: 1 }
    })
    expect(status).toBe(404)
  })

  test('soft-delete sets isActive=false', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const p = await createProduct()
    const { status } = await api(`/api/v1/admin/products/${p.id}`, {
      method: 'DELETE',
      token: admin.accessToken
    })
    expect(status).toBe(200)
    // Public list shouldn't show it
    const list = await api('/api/v1/products')
    expect(list.body.data.items.find((x: any) => x.id === p.id)).toBeUndefined()
  })

  test('paginated list returns total (B3)', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    for (let i = 0; i < 5; i++) await createProduct({ name: `p${i}` })
    const { body } = await api('/api/v1/admin/products?limit=2', { token: admin.accessToken })
    expect(body.data.total).toBe(5)
    expect(body.data.items.length).toBe(2)
    expect(body.data.page).toBe(1)
    expect(body.data.limit).toBe(2)
  })
})

describe('variant FK protection (B4)', () => {
  test('cannot delete variant referenced by an order item', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const customer = await createUser({ email: 'c@b.com' })
    const p = await createProduct({ stock: 100 })
    const v = await createVariant(p.id, { stock: 5 })
    await addCartItem(customer.id, p.id, { variantId: v.id })
    await api('/api/v1/orders', { method: 'POST', token: customer.accessToken, body: { address: 'x' } })

    const { status, body } = await api(`/api/v1/admin/products/${p.id}/variants/${v.id}`, {
      method: 'DELETE',
      token: admin.accessToken
    })
    expect(status).toBe(409)
    expect(body.error).toContain('引用')
  })

  test('can delete variant with no references', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const p = await createProduct()
    const v = await createVariant(p.id)
    const { status } = await api(`/api/v1/admin/products/${p.id}/variants/${v.id}`, {
      method: 'DELETE',
      token: admin.accessToken
    })
    expect(status).toBe(200)
  })
})

describe('category FK protection (B5)', () => {
  test('cannot delete category referenced by a product', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const cat = await createCategory()
    await createProduct({ categoryId: cat.id })
    const { status, body } = await api(`/api/v1/admin/categories/${cat.id}`, {
      method: 'DELETE',
      token: admin.accessToken
    })
    expect(status).toBe(409)
    expect(body.error).toContain('商品')
  })

  test('can delete category with no products', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const cat = await createCategory('Hats', 'hats')
    const { status } = await api(`/api/v1/admin/categories/${cat.id}`, {
      method: 'DELETE',
      token: admin.accessToken
    })
    expect(status).toBe(200)
  })

  test('create category returns the new record', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status, body } = await api('/api/v1/admin/categories', {
      method: 'POST',
      token: admin.accessToken,
      body: { name: 'Shoes', slug: 'shoes' }
    })
    expect(status).toBe(201)
    expect(body.data.slug).toBe('shoes')
  })

  test('duplicate slug rejected', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    await createCategory('A', 'dup')
    const { status } = await api('/api/v1/admin/categories', {
      method: 'POST',
      token: admin.accessToken,
      body: { name: 'B', slug: 'dup' }
    })
    expect(status).toBe(400)
  })
})

describe('order status update', () => {
  test('valid status transition', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const customer = await createUser({ email: 'c@b.com' })
    const p = await createProduct({ stock: 100 })
    await addCartItem(customer.id, p.id)
    const r = await api('/api/v1/orders', { method: 'POST', token: customer.accessToken, body: { address: 'x' } })

    const { status } = await api(`/api/v1/admin/orders/${r.body.data.id}`, {
      method: 'PUT',
      token: admin.accessToken,
      body: { status: 'paid' }
    })
    expect(status).toBe(200)
  })

  test('invalid status rejected by zod', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status } = await api('/api/v1/admin/orders/1', {
      method: 'PUT',
      token: admin.accessToken,
      body: { status: 'imaginary' }
    })
    expect(status).toBe(400)
  })

  test('non-existent order 404', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status } = await api('/api/v1/admin/orders/99999', {
      method: 'PUT',
      token: admin.accessToken,
      body: { status: 'paid' }
    })
    expect(status).toBe(404)
  })
})
