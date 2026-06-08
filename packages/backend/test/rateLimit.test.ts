import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import './helpers/setup'
import { rateLimit } from '../src/middleware/rateLimit'
import { Hono } from 'hono'

describe('rateLimit middleware', () => {
  beforeEach(() => {
    // Enable for these tests by clearing the disable flag.
    delete process.env.RATE_LIMIT_DISABLED
  })

  afterEach(() => {
    process.env.RATE_LIMIT_DISABLED = '1'
  })

  test('allows up to limit, then 429', async () => {
    const app = new Hono()
    app.use('*', rateLimit({ limit: 3, windowMs: 60_000 }))
    app.get('/', (c) => c.text('ok'))

    const headers = { 'x-forwarded-for': '1.2.3.4' }
    const r1 = await app.fetch(new Request('http://t/', { headers }))
    const r2 = await app.fetch(new Request('http://t/', { headers }))
    const r3 = await app.fetch(new Request('http://t/', { headers }))
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(r3.status).toBe(200)

    const r4 = await app.fetch(new Request('http://t/', { headers }))
    expect(r4.status).toBe(429)
    expect(r4.headers.get('Retry-After')).toBeDefined()
  })

  test('different IPs have independent buckets', async () => {
    const app = new Hono()
    app.use('*', rateLimit({ limit: 1, windowMs: 60_000 }))
    app.get('/', (c) => c.text('ok'))

    const a = await app.fetch(new Request('http://t/', { headers: { 'x-forwarded-for': '10.0.0.1' } }))
    expect(a.status).toBe(200)
    const aSecond = await app.fetch(new Request('http://t/', { headers: { 'x-forwarded-for': '10.0.0.1' } }))
    expect(aSecond.status).toBe(429)

    const b = await app.fetch(new Request('http://t/', { headers: { 'x-forwarded-for': '10.0.0.2' } }))
    expect(b.status).toBe(200) // Different IP, fresh bucket
  })

  test('window resets after windowMs', async () => {
    const app = new Hono()
    app.use('*', rateLimit({ limit: 1, windowMs: 50 }))
    app.get('/', (c) => c.text('ok'))

    const headers = { 'x-forwarded-for': '5.5.5.5' }
    const r1 = await app.fetch(new Request('http://t/', { headers }))
    expect(r1.status).toBe(200)
    const r2 = await app.fetch(new Request('http://t/', { headers }))
    expect(r2.status).toBe(429)

    await new Promise(r => setTimeout(r, 60))
    const r3 = await app.fetch(new Request('http://t/', { headers }))
    expect(r3.status).toBe(200)
  })

  test('honors RATE_LIMIT_DISABLED=1', async () => {
    process.env.RATE_LIMIT_DISABLED = '1'
    const app = new Hono()
    app.use('*', rateLimit({ limit: 1, windowMs: 60_000 }))
    app.get('/', (c) => c.text('ok'))

    for (let i = 0; i < 10; i++) {
      const r = await app.fetch(new Request('http://t/'))
      expect(r.status).toBe(200)
    }
  })
})
