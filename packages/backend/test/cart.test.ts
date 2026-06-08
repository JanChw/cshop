import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { cartItems } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { createUser, createProduct, createVariant, addCartItem } from './helpers/factories'

describe('cart CRUD', () => {
  test('GET requires auth', async () => {
    const { status } = await api('/api/v1/cart')
    expect(status).toBe(401)
  })

  test('POST adds item, returns record', async () => {
    const u = await createUser()
    const p = await createProduct()
    const { status, body } = await api('/api/v1/cart', {
      method: 'POST',
      token: u.accessToken,
      body: { productId: p.id, quantity: 2 }
    })
    expect(status).toBe(201)
    expect(body.data.productId).toBe(p.id)
    expect(body.data.quantity).toBe(2)
  })

  test('GET returns only the user\'s items', async () => {
    const a = await createUser({ email: 'aa@b.com' })
    const b = await createUser({ email: 'bb@b.com' })
    const p = await createProduct()
    await addCartItem(a.id, p.id)
    await addCartItem(b.id, p.id)
    await addCartItem(b.id, p.id)

    const { body } = await api('/api/v1/cart', { token: a.accessToken })
    expect(body.data.items.length).toBe(1)
  })

  test('PUT updates quantity for own item', async () => {
    const u = await createUser()
    const p = await createProduct()
    const item = await addCartItem(u.id, p.id, { quantity: 1 })

    const { status } = await api(`/api/v1/cart/${item.id}`, {
      method: 'PUT',
      token: u.accessToken,
      body: { quantity: 5 }
    })
    expect(status).toBe(200)
    const [refreshed] = await db.select().from(cartItems).where(eq(cartItems.id, item.id))
    expect(refreshed.quantity).toBe(5)
  })

  test('PUT another user\'s item returns 404 (B14)', async () => {
    const a = await createUser({ email: 'a@x.com' })
    const b = await createUser({ email: 'b@x.com' })
    const p = await createProduct()
    const item = await addCartItem(a.id, p.id)

    const { status } = await api(`/api/v1/cart/${item.id}`, {
      method: 'PUT',
      token: b.accessToken,
      body: { quantity: 9 }
    })
    expect(status).toBe(404)
    const [refreshed] = await db.select().from(cartItems).where(eq(cartItems.id, item.id))
    expect(refreshed.quantity).toBe(1) // unchanged
  })

  test('DELETE removes only own item', async () => {
    const a = await createUser({ email: 'aa@y.com' })
    const b = await createUser({ email: 'bb@y.com' })
    const p = await createProduct()
    const itemA = await addCartItem(a.id, p.id)
    const itemB = await addCartItem(b.id, p.id)

    // B tries to delete A's item
    await api(`/api/v1/cart/${itemA.id}`, { method: 'DELETE', token: b.accessToken })

    const aRows = await db.select().from(cartItems).where(eq(cartItems.id, itemA.id))
    expect(aRows.length).toBe(1) // A's still there

    // A deletes own
    await api(`/api/v1/cart/${itemA.id}`, { method: 'DELETE', token: a.accessToken })
    const aRowsAfter = await db.select().from(cartItems).where(eq(cartItems.id, itemA.id))
    expect(aRowsAfter.length).toBe(0)
    expect(itemB.id).toBeDefined()
  })

  test('POST with invalid body 400', async () => {
    const u = await createUser()
    const { status } = await api('/api/v1/cart', {
      method: 'POST',
      token: u.accessToken,
      body: { quantity: 0 }
    })
    expect(status).toBe(400)
  })
})
