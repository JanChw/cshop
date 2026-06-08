import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { activityEvents, userOnline } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { createUser, createProduct } from './helpers/factories'
import { flush } from '../src/utils/eventQueue'
import { detectDevice } from '../src/utils/deviceDetect'

describe('deviceDetect', () => {
  test('detects iPhone as mobile', () => {
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)')).toBe('mobile')
  })

  test('detects Android Mobile as mobile', () => {
    expect(detectDevice('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36')).toBe('mobile')
  })

  test('detects Android without Mobile as tablet', () => {
    expect(detectDevice('Mozilla/5.0 (Linux; Android 13; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')).toBe('tablet')
  })

  test('detects iPad as tablet', () => {
    expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('tablet')
  })

  test('detects desktop Chrome', () => {
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0')).toBe('desktop')
  })

  test('null/undefined returns desktop', () => {
    expect(detectDevice(null)).toBe('desktop')
    expect(detectDevice(undefined)).toBe('desktop')
    expect(detectDevice('')).toBe('desktop')
  })
})

describe('tracker middleware', () => {
  test('records activity event for authenticated request', async () => {
    const user = await createUser()
    await api('/api/v1/cart', { method: 'GET', token: user.accessToken })
    await flush()

    const [event] = db.select().from(activityEvents).limit(1).all()
    expect(event).toBeDefined()
    expect(event.userId).toBe(user.id)
    expect(event.eventType).toBe('api_call')
    expect(event.path).toBe('/api/v1/cart')
    expect(event.method).toBe('GET')
    expect(event.deviceType).toBe('desktop')
  })

  test('does not record event for unauthenticated request', async () => {
    await api('/api/v1/products')
    await flush()

    const events = db.select().from(activityEvents).all()
    expect(events.length).toBe(0)
  })

  test('upserts user_online on authenticated request', async () => {
    const user = await createUser()
    await api('/api/v1/cart', { method: 'GET', token: user.accessToken })
    await flush()

    const [online] = db.select().from(userOnline).where(eq(userOnline.userId, user.id)).limit(1).all()
    expect(online).toBeDefined()
  })

  test('tracks login event', async () => {
    await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email: 'track@test.local', password: 'password123', name: 'Tracker' }
    })
    await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'track@test.local', password: 'password123' }
    })
    await flush()

    const events = db.select().from(activityEvents).all()
    const loginEvent = events.find(e => e.eventType === 'login')
    expect(loginEvent).toBeDefined()
  })
})

describe('business event tracking', () => {
  test('tracks product_view', async () => {
    const user = await createUser()
    const product = await createProduct()
    await api(`/api/v1/products/${product.id}`, { token: user.accessToken })
    await flush()

    const events = db.select().from(activityEvents).all()
    const viewEvent = events.find(e => e.eventType === 'product_view')
    expect(viewEvent).toBeDefined()
    const meta = JSON.parse(viewEvent!.metadata!)
    expect(meta.productId).toBe(product.id)
  })

  test('tracks cart_add', async () => {
    const user = await createUser()
    const product = await createProduct()
    await api('/api/v1/cart', {
      method: 'POST',
      token: user.accessToken,
      body: { productId: product.id, quantity: 1 }
    })
    await flush()

    const events = db.select().from(activityEvents).all()
    const addEvent = events.find(e => e.eventType === 'cart_add')
    expect(addEvent).toBeDefined()
  })

  test('tracks order_create', async () => {
    const user = await createUser()
    const product = await createProduct({ stock: 10 })
    await api('/api/v1/cart', {
      method: 'POST',
      token: user.accessToken,
      body: { productId: product.id, quantity: 1 }
    })
    await api('/api/v1/orders', {
      method: 'POST',
      token: user.accessToken,
      body: { address: '123 Test St' }
    })
    await flush()

    const events = db.select().from(activityEvents).all()
    const orderEvent = events.find(e => e.eventType === 'order_create')
    expect(orderEvent).toBeDefined()
  })
})
