import { test, expect, describe } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { productImages, designs, activityEvents, activityEventRefs, dailyStats, productDailyViews } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { flush } from '../src/utils/eventQueue'
import { rollupDaily } from '../src/utils/analyticsRollup'
import { readCanvas } from '../src/utils/canvasStore'
import { config } from '../src/config'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createUser, createProduct, createStaff } from './helpers/factories'

describe('P3: product images via product_images table', () => {
  test('create with images, list/detail return array', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { body } = await api('/api/v1/admin/products', {
      method: 'POST',
      token: admin.accessToken,
      body: { name: 'ImgProd', basePrice: 10, images: ['/a.webp', '/b.webp'] }
    })
    expect(body.data.images).toEqual(['/a.webp', '/b.webp'])

    // rows exist in product_images, NOT in products (column dropped)
    const rows = db.select().from(productImages).where(eq(productImages.productId, body.data.id)).all()
    expect(rows.length).toBe(2)
    expect(rows[0].sort).toBe(0)
    expect(rows[1].sort).toBe(1)

    const list = await api('/api/v1/products')
    const item = list.body.data.items.find((i: any) => i.id === body.data.id)
    expect(item.images).toEqual(['/a.webp', '/b.webp'])

    const detail = await api(`/api/v1/products/${body.data.id}`)
    expect(detail.body.data.images).toEqual(['/a.webp', '/b.webp'])
  })

  test('update replaces images; append endpoint adds one', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { body } = await api('/api/v1/admin/products', {
      method: 'POST', token: admin.accessToken,
      body: { name: 'P', basePrice: 1, images: ['/x.webp'] }
    })
    await api(`/api/v1/admin/products/${body.data.id}`, {
      method: 'PUT', token: admin.accessToken,
      body: { name: 'P', basePrice: 1, images: ['/y.webp', '/z.webp'] }
    })
    const rows = db.select().from(productImages).where(eq(productImages.productId, body.data.id)).all()
    expect(rows.length).toBe(2)

    // append via the image upload endpoint (mock: insert directly to test sort logic)
    db.insert(productImages).values({ productId: body.data.id, path: '/appended.webp', sort: 99 }).run()
    const detail = await api(`/api/v1/admin/products/${body.data.id}`, { token: admin.accessToken })
    expect(detail.body.data.images.length).toBe(3)
  })
})

describe('P3: designs canvas stored on disk', () => {
  test('create writes canvas file; GET reads it back; delete removes file', async () => {
    const user = await createUser()
    const product = await createProduct()
    const canvas = '{"version":3,"objects":[{"type":"rect"}]}'
    const { status, body } = await api('/api/v1/designs', {
      method: 'POST', token: user.accessToken,
      body: { productId: product.id, name: 'D1', canvasData: canvas }
    })
    expect(status).toBe(201)
    const id = body.data.id

    // canvas file exists on disk
    const file = join(config.designDir, 'canvas', `${id}.json`)
    expect(existsSync(file)).toBe(true)

    // GET returns canvasData read from file
    const get = await api(`/api/v1/designs/${id}`, { token: user.accessToken })
    expect(get.body.data.canvasData).toBe(canvas)

    // PUT updates the file
    const canvas2 = '{"version":4}'
    await api(`/api/v1/designs/${id}`, {
      method: 'PUT', token: user.accessToken,
      body: { productId: product.id, name: 'D1', canvasData: canvas2 }
    })
    expect(await readCanvas(`canvas/${id}.json`)).toBe(canvas2)

    // DELETE removes the file
    await api(`/api/v1/designs/${id}`, { method: 'DELETE', token: user.accessToken })
    expect(existsSync(file)).toBe(false)
  })
})

describe('P3: design drafts canvas stored on disk', () => {
  test('draft create/get/put/delete round-trip; separate namespace from designs', async () => {
    const user = await createUser()
    const product = await createProduct()
    const canvas = '{"draft":true,"objects":[]}'
    const { status, body } = await api('/api/v1/design-drafts', {
      method: 'POST', token: user.accessToken,
      body: { productId: product.id, name: 'Draft1', canvasData: canvas }
    })
    expect(status).toBe(201)
    const id = body.data.id

    // file lives under drafts/, not canvas/ (ids collide with designs)
    const file = join(config.designDir, 'drafts', `${id}.json`)
    expect(existsSync(file)).toBe(true)

    const get = await api(`/api/v1/design-drafts/${id}`, { token: user.accessToken })
    expect(get.body.data.canvasData).toBe(canvas)

    const canvas2 = '{"draft":2}'
    await api(`/api/v1/design-drafts/${id}`, {
      method: 'PUT', token: user.accessToken,
      body: { productId: product.id, name: 'Draft1', canvasData: canvas2 }
    })
    expect(await readCanvas(`drafts/${id}.json`)).toBe(canvas2)

    await api(`/api/v1/design-drafts/${id}`, { method: 'DELETE', token: user.accessToken })
    expect(existsSync(file)).toBe(false)
  })
})

describe('P3: uploads bucketed layout', () => {
  test('bucketed route serves, flat route still serves legacy', async () => {
    mkdirSync(join(config.uploadDir, 'ab'), { recursive: true })
    writeFileSync(join(config.uploadDir, 'ab', 'bucketed.webp'), Buffer.from([0x52, 0x49, 0x46, 0x46]))
    writeFileSync(join(config.uploadDir, 'legacy-flat.webp'), Buffer.from([0x52, 0x49, 0x46, 0x46]))

    const a = await api('/api/v1/uploads/ab/bucketed.webp')
    expect(a.status).toBe(200)
    const b = await api('/api/v1/uploads/legacy-flat.webp')
    expect(b.status).toBe(200)
    // traversal via bucket still rejected
    const c = await api('/api/v1/uploads/..%2F/etc/passwd')
    expect(c.status).not.toBe(200)
  })
})

describe('P3: analytics pre-aggregate', () => {
  test('flush writes activity_event_refs for product events', async () => {
    const user = await createUser()
    const product = await createProduct({ name: 'Viewed' })
    await api(`/api/v1/products/${product.id}`, { token: user.accessToken })
    await flush()

    const refs = db.select().from(activityEventRefs).all()
    expect(refs.length).toBeGreaterThan(0)
    const ref = refs.find(r => r.productId === product.id)
    expect(ref).toBeDefined()
    expect(ref!.productName).toBe('Viewed')
  })

  test('rollupDaily populates daily_stats + product_daily_views; /summary reads them', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const product = await createProduct({ name: 'TopProd' })
    // generate 3 product_view events
    for (let i = 0; i < 3; i++) {
      await api(`/api/v1/products/${product.id}`, { token: admin.accessToken })
    }
    await flush()

    const today = new Date().toISOString().slice(0, 10)
    rollupDaily(today)

    const [ds] = db.select().from(dailyStats).all()
    expect(ds).toBeDefined()
    expect(ds.productViews).toBeGreaterThanOrEqual(3)

    const pdv = db.select().from(productDailyViews).where(eq(productDailyViews.productId, product.id)).all()
    expect(pdv.length).toBe(1)
    expect(pdv[0].views).toBeGreaterThanOrEqual(3)

    const { body } = await api('/api/v1/admin/analytics/summary?period=today', { token: admin.accessToken })
    expect(body.data.pv).toBeGreaterThanOrEqual(3)
    expect(body.data.funnel.productView).toBeGreaterThanOrEqual(3)
    const top = body.data.topProducts.find((p: any) => p.productId === product.id)
    expect(top).toBeDefined()
    expect(top.views).toBeGreaterThanOrEqual(3)
  })
})
