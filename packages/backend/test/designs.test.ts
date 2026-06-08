import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { createUser, createProduct } from './helpers/factories'

describe('designs CRUD', () => {
  test('requires auth', async () => {
    const { status } = await api('/api/v1/designs')
    expect(status).toBe(401)
  })

  test('POST creates a design', async () => {
    const u = await createUser()
    const p = await createProduct()
    const { status, body } = await api('/api/v1/designs', {
      method: 'POST',
      token: u.accessToken,
      body: { productId: p.id, name: 'd1', canvasData: '{"v":1}' }
    })
    expect(status).toBe(201)
    expect(body.data.name).toBe('d1')
  })

  test('GET lists own designs newest-first (B2)', async () => {
    const u = await createUser()
    const p = await createProduct()
    const d1 = await api('/api/v1/designs', {
      method: 'POST', token: u.accessToken,
      body: { productId: p.id, name: 'first', canvasData: '{}' }
    })
    await new Promise(r => setTimeout(r, 1100))
    const d2 = await api('/api/v1/designs', {
      method: 'POST', token: u.accessToken,
      body: { productId: p.id, name: 'second', canvasData: '{}' }
    })

    const { body } = await api('/api/v1/designs', { token: u.accessToken })
    expect(body.data.items[0].id).toBe(d2.body.data.id)
    expect(body.data.items[1].id).toBe(d1.body.data.id)
  })

  test('GET single design must belong to user', async () => {
    const a = await createUser({ email: 'a@d.com' })
    const b = await createUser({ email: 'b@d.com' })
    const p = await createProduct()
    const d = await api('/api/v1/designs', {
      method: 'POST', token: a.accessToken,
      body: { productId: p.id, name: 'a-design', canvasData: '{}' }
    })
    const id = d.body.data.id

    const r = await api(`/api/v1/designs/${id}`, { token: b.accessToken })
    expect(r.status).toBe(404)
  })

  test('PUT non-existent returns 404', async () => {
    const u = await createUser()
    const p = await createProduct()
    const { status } = await api('/api/v1/designs/9999', {
      method: 'PUT', token: u.accessToken,
      body: { productId: p.id, name: 'x', canvasData: '{}' }
    })
    expect(status).toBe(404)
  })

  test('PUT updates own design', async () => {
    const u = await createUser()
    const p = await createProduct()
    const created = await api('/api/v1/designs', {
      method: 'POST', token: u.accessToken,
      body: { productId: p.id, name: 'orig', canvasData: '{}' }
    })
    const { status } = await api(`/api/v1/designs/${created.body.data.id}`, {
      method: 'PUT', token: u.accessToken,
      body: { productId: p.id, name: 'renamed', canvasData: '{}' }
    })
    expect(status).toBe(200)
  })

  test('DELETE only own design', async () => {
    const a = await createUser({ email: 'aa@d.com' })
    const b = await createUser({ email: 'bb@d.com' })
    const p = await createProduct()
    const created = await api('/api/v1/designs', {
      method: 'POST', token: a.accessToken,
      body: { productId: p.id, name: 'mine', canvasData: '{}' }
    })
    const id = created.body.data.id

    // B's delete is silently no-op (where userId doesn't match)
    await api(`/api/v1/designs/${id}`, { method: 'DELETE', token: b.accessToken })
    const stillThere = await api(`/api/v1/designs/${id}`, { token: a.accessToken })
    expect(stillThere.status).toBe(200)

    // A actually deletes
    await api(`/api/v1/designs/${id}`, { method: 'DELETE', token: a.accessToken })
    const gone = await api(`/api/v1/designs/${id}`, { token: a.accessToken })
    expect(gone.status).toBe(404)
  })
})
