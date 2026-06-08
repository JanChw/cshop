import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { products, productVariants, orders, orderItems, cartItems } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { createUser, createProduct, createVariant, addCartItem } from './helpers/factories'

describe('order creation (A8)', () => {
  test('happy path: cart cleared, stock decremented, orderItems written', async () => {
    const u = await createUser()
    const p = await createProduct({ basePrice: 100, stock: 10 })
    await addCartItem(u.id, p.id, { quantity: 2 })

    const { status, body } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: { address: '123 Main' }
    })
    expect(status).toBe(201)
    expect(body.data.total).toBe(200)
    expect(body.data.status).toBe('pending')

    // Cart cleared
    const cart = await db.select().from(cartItems).where(eq(cartItems.userId, u.id))
    expect(cart.length).toBe(0)

    // Stock decremented
    const [refreshed] = await db.select().from(products).where(eq(products.id, p.id))
    expect(refreshed.stock).toBe(8)

    // OrderItem written
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, body.data.id))
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(2)
    expect(items[0].price).toBe(100)
  })

  test('insufficient stock fails, no order written, cart preserved', async () => {
    const u = await createUser()
    const p = await createProduct({ stock: 3 })
    await addCartItem(u.id, p.id, { quantity: 5 })

    const { status, body } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: { address: '123' }
    })
    expect(status).toBe(400)
    expect(body.error).toContain('库存不足')

    const ord = await db.select().from(orders).where(eq(orders.userId, u.id))
    expect(ord.length).toBe(0)
    const cart = await db.select().from(cartItems).where(eq(cartItems.userId, u.id))
    expect(cart.length).toBe(1)
    const [refreshed] = await db.select().from(products).where(eq(products.id, p.id))
    expect(refreshed.stock).toBe(3) // unchanged
  })

  test('inactive product fails order', async () => {
    const u = await createUser()
    const p = await createProduct({ isActive: false })
    await addCartItem(u.id, p.id)

    const { status, body } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: { address: '123' }
    })
    expect(status).toBe(400)
    expect(body.error).toContain('已下架')
  })

  test('variant price adjustment applied', async () => {
    const u = await createUser()
    const p = await createProduct({ basePrice: 100, stock: 100 })
    const v = await createVariant(p.id, { priceAdjustment: 25, stock: 5 })
    await addCartItem(u.id, p.id, { variantId: v.id, quantity: 2 })

    const { body } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: { address: '123' }
    })
    expect(body.data.total).toBe(250) // (100 + 25) * 2

    // Variant stock decremented (not product stock)
    const [refreshedV] = await db.select().from(productVariants).where(eq(productVariants.id, v.id))
    expect(refreshedV.stock).toBe(3)
    const [refreshedP] = await db.select().from(products).where(eq(products.id, p.id))
    expect(refreshedP.stock).toBe(100) // unchanged when variant is used
  })

  test('mismatched variant rejected', async () => {
    const u = await createUser()
    const p1 = await createProduct({ name: 'A', stock: 10 })
    const p2 = await createProduct({ name: 'B', stock: 10 })
    const variantOfP2 = await createVariant(p2.id, { stock: 10 })
    // Cart references P1 with P2's variant — invalid.
    await addCartItem(u.id, p1.id, { variantId: variantOfP2.id })

    const { status, body } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: { address: 'x' }
    })
    expect(status).toBe(400)
    expect(body.error).toContain('不属于')
  })

  test('empty cart 400', async () => {
    const u = await createUser()
    const { status } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: { address: 'x' }
    })
    expect(status).toBe(400)
  })

  test('missing address 400', async () => {
    const u = await createUser()
    const p = await createProduct()
    await addCartItem(u.id, p.id)
    const { status } = await api('/api/v1/orders', {
      method: 'POST',
      token: u.accessToken,
      body: {}
    })
    expect(status).toBe(400)
  })
})

describe('order list (B2)', () => {
  test('returns orders newest first', async () => {
    const u = await createUser()
    const p = await createProduct({ stock: 100 })
    await addCartItem(u.id, p.id)
    const r1 = await api('/api/v1/orders', { method: 'POST', token: u.accessToken, body: { address: 'a' } })
    // small delay so createdAt differs
    await new Promise(r => setTimeout(r, 1100))
    await addCartItem(u.id, p.id)
    const r2 = await api('/api/v1/orders', { method: 'POST', token: u.accessToken, body: { address: 'b' } })

    const { body } = await api('/api/v1/orders', { token: u.accessToken })
    expect(body.data.items[0].id).toBe(r2.body.data.id)
    expect(body.data.items[1].id).toBe(r1.body.data.id)
  })
})

describe('order isolation', () => {
  test('user can only see own orders', async () => {
    const a = await createUser({ email: 'a@b.com' })
    const b = await createUser({ email: 'b@b.com' })
    const p = await createProduct({ stock: 10 })
    await addCartItem(a.id, p.id)
    await api('/api/v1/orders', { method: 'POST', token: a.accessToken, body: { address: 'x' } })

    const { body } = await api('/api/v1/orders', { token: b.accessToken })
    expect(body.data.items.length).toBe(0)
  })
})
