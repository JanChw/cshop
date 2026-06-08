import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { createProduct, createCategory } from './helpers/factories'

describe('public products list (B3)', () => {
  test('returns paginated items with total', async () => {
    for (let i = 0; i < 5; i++) await createProduct({ name: `P${i}` })
    const { status, body } = await api('/api/v1/products?page=1&limit=2')
    expect(status).toBe(200)
    expect(body.data.total).toBe(5)
    expect(body.data.items.length).toBe(2)
    expect(body.data.page).toBe(1)
    expect(body.data.limit).toBe(2)
  })

  test('filters out inactive products', async () => {
    await createProduct({ name: 'A', isActive: true })
    await createProduct({ name: 'B', isActive: false })
    const { body } = await api('/api/v1/products')
    expect(body.data.total).toBe(1)
    expect(body.data.items[0].name).toBe('A')
  })

  test('filters by category', async () => {
    const c1 = await createCategory('Tees', 'tees-x')
    const c2 = await createCategory('Hats', 'hats-x')
    await createProduct({ name: 'tee1', categoryId: c1.id })
    await createProduct({ name: 'tee2', categoryId: c1.id })
    await createProduct({ name: 'hat1', categoryId: c2.id })

    const { body } = await api(`/api/v1/products?categoryId=${c1.id}`)
    expect(body.data.total).toBe(2)
  })

  test('invalid categoryId is ignored', async () => {
    await createProduct()
    const { body } = await api('/api/v1/products?categoryId=abc')
    expect(body.data.items.length).toBeGreaterThan(0)
  })

  test('clamps oversized limit', async () => {
    for (let i = 0; i < 3; i++) await createProduct()
    const { body } = await api('/api/v1/products?limit=999')
    expect(body.data.limit).toBe(100) // clamped
  })
})

describe('product detail', () => {
  test('returns product with variants', async () => {
    const p = await createProduct()
    const { status, body } = await api(`/api/v1/products/${p.id}`)
    expect(status).toBe(200)
    expect(body.data.id).toBe(p.id)
    expect(Array.isArray(body.data.variants)).toBe(true)
  })

  test('non-existent 404', async () => {
    const { status } = await api('/api/v1/products/99999')
    expect(status).toBe(404)
  })
})
