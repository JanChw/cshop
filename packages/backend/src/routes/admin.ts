import { Hono } from 'hono'
import { db } from '../db'
import {
  products, productVariants, orders, orderItems,
  cartItems, designs, users, uploads, productVariantOptions, categories,
  productBaseDesigns
} from '../db/schema'
import { eq, desc, count, sum, and, sql, inArray, like, asc, isNull, isNotNull } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { productSchema, productVariantSchema, orderStatusSchema, variantBatchDeleteSchema, variantBatchUpdateSchema, productVariantOptionSchema, productVariantOptionUpdateSchema, productBatchDeleteSchema } from '../validators'
import { trackBusinessEvent } from '../utils/track'
import { canTransition } from '../utils/orderTransitions'
import { processImage, removeBackground, generateMask, flattenOnWhite } from '../utils/image'
import { config } from '../config'
import backupRoutes from './admin/backup'
import { adminStickerRoutes } from './stickers'
import { adminCategoryRoutes } from './categories'
import analyticsRoutes from './admin/analytics'
import settingsRoutes from './admin/settings'
import staffRoutes from './admin/staff'
import rolesRoutes from './admin/roles'
import usersRoutes from './admin/users'
import uploadsRoutes from './admin/uploads'
import menusRoutes from './admin/menus'
import homeRoutes from './admin/home'
import designConfigRoutes from './admin/design-config'
import { adminVariantOptionsRoutes } from './variantOptions'
import inventoryRoutes from './admin/inventory'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/dashboard', requirePermission('analytics.read'), async (c) => {
  const [productRow] = await db.select({ n: count() }).from(products)
  const [orderRow] = await db.select({ n: count() }).from(orders)
  const [pendingRow] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, 'pending'))
  const [revenueRow] = await db
    .select({ total: sum(orders.total) })
    .from(orders)
    .where(eq(orders.status, 'completed'))

  const totalRevenue = revenueRow?.total ? Number(revenueRow.total) : 0

  return success(c, {
    productCount: productRow?.n ?? 0,
    orderCount: orderRow?.n ?? 0,
    pendingCount: pendingRow?.n ?? 0,
    totalRevenue
  })
})

app.get('/products', requirePermission('product.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const includeInactive = c.req.query('includeInactive') === 'true'
  const onlyDeleted = c.req.query('onlyDeleted') === 'true'
  const q = c.req.query('q')?.trim()
  const categoryId = c.req.query('categoryId')

  const conditions = []
  if (onlyDeleted) {
    conditions.push(isNotNull(products.deletedAt))
  } else {
    if (!includeInactive) conditions.push(eq(products.isActive, true))
    conditions.push(isNull(products.deletedAt))
  }
  if (q) {
    const escaped = q.replace(/[\\%_]/g, ch => '\\' + ch)
    conditions.push(sql`${products.name} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`)
  }
  if (categoryId) {
    conditions.push(eq(products.categoryId, parseInt(categoryId)))
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const baseQuery = db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    basePrice: products.basePrice,
    categoryId: products.categoryId,
    categoryName: categories.name,
    images: products.images,
    stock: products.stock,
    isActive: products.isActive,
    createdAt: products.createdAt,
    deletedAt: products.deletedAt
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id))
  const countQuery = db.select({ n: count() }).from(products)

  const [items, [{ n: total }]] = await Promise.all([
    (where ? baseQuery.where(where) : baseQuery).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
    where ? countQuery.where(where) : countQuery
  ])

  return success(c, { items: items.map(i => ({ ...i, images: i.images ? JSON.parse(i.images) : [] })), total, page, limit })
})

app.get('/products/export', requirePermission('product.read'), async (c) => {
  const items = db.select({
    id: products.id,
    name: products.name,
    basePrice: products.basePrice,
    stock: products.stock,
    isActive: products.isActive,
    categoryName: categories.name,
    description: products.description,
    tags: products.tags,
    fabric: products.fabric,
    fit: products.fit,
    designer: products.designer,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(isNull(products.deletedAt))
    .all()

  const variantMap: Record<number, typeof productVariants.$inferSelect[]> = {}
  const pIds = items.map(i => i.id)
  if (pIds.length > 0) {
    const variants = db.select().from(productVariants)
      .where(inArray(productVariants.productId, pIds))
      .all()
    for (const v of variants) {
      if (!variantMap[v.productId]) variantMap[v.productId] = []
      variantMap[v.productId].push(v)
    }
  }

  const header = 'ID,名称,价格,库存,状态,分类,描述,标签,面料,版型,设计师,规格'
  const rows = items.map((p) => {
    const vStr = (variantMap[p.id] ?? [])
      .map(v => `${v.size}/${v.color ?? '-'}/${v.material ?? '-'}/${v.weight ?? '-'}`)
      .join('; ')
    return [
      p.id,
      escapeCsv(p.name),
      p.basePrice,
      p.stock,
      p.isActive ? '上架' : '下架',
      escapeCsv(p.categoryName ?? ''),
      escapeCsv(p.description ?? ''),
      escapeCsv(p.tags ?? ''),
      escapeCsv(p.fabric ?? ''),
      escapeCsv(p.fit ?? ''),
      escapeCsv(p.designer ?? ''),
      escapeCsv(vStr),
    ].join(',')
  }).join('\n')

  const csv = `${header}\n${rows}`
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`)
  return c.body(csv)
})

function escapeCsv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

app.post('/products/import', requirePermission('product.create'), async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  if (!file || !(file instanceof File)) {
    return fail(c, '请上传 CSV 文件', 400)
  }
  if (!file.name.endsWith('.csv')) {
    return fail(c, '仅支持 CSV 格式', 400)
  }

  const text = await file.text()
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) {
    return fail(c, 'CSV 文件至少包含表头和一行数据', 400)
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current)
    return result
  }

  let imported = 0
  let errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.length < 3) {
      errors.push(`第 ${i + 1} 行：列数不足`)
      continue
    }
    const name = cols[1]?.trim()
    const price = parseFloat(cols[2]?.trim())
    if (!name || isNaN(price)) {
      errors.push(`第 ${i + 1} 行：名称或价格无效`)
      continue
    }

    try {
      const [product] = await db.insert(products).values({
        name,
        basePrice: price,
        stock: parseInt(cols[3]?.trim()) || 0,
        description: cols[6]?.trim() || null,
        tags: cols[7]?.trim() || null,
        fabric: cols[8]?.trim() || null,
        fit: cols[9]?.trim() || null,
        designer: cols[10]?.trim() || null,
        isActive: (cols[5]?.trim() || '上架') === '上架',
      }).returning().all()
      imported++
    } catch (err: any) {
      errors.push(`第 ${i + 1} 行：${err.message || '导入失败'}`)
    }
  }

  return success(c, {
    imported,
    total: lines.length - 1,
    errors: errors.slice(0, 20),
    hasMoreErrors: errors.length > 20,
  })
})

app.get('/products/:id', requirePermission('product.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!product) {
    return fail(c, '商品不存在', 404)
  }
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id))
  product.images = product.images ? JSON.parse(product.images) : []
  return success(c, { ...product, variants })
})

app.post('/products', requirePermission('product.create'), validateJson(productSchema), async (c) => {
  const data = c.req.valid('json')
  const dbData = { ...data, images: data.images ? JSON.stringify(data.images) : null }
  const [record] = await db.insert(products).values(dbData).returning()
  return success(c, record, 201)
})

app.put('/products/:id', requirePermission('product.update'), validateJson(productSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }

  const dbData = { ...data, images: data.images ? JSON.stringify(data.images) : undefined }
  await db.update(products).set(dbData).where(eq(products.id, id))
  return success(c, null)
})

app.patch('/products/:id/status', requirePermission('product.update'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const { isActive } = await c.req.json()

  if (typeof isActive !== 'boolean') return fail(c, 'isActive 必须是布尔值', 400)

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) return fail(c, '商品不存在', 404)

  await db.update(products).set({ isActive }).where(eq(products.id, id))
  return success(c, null)
})

app.post('/products/:id/image', requirePermission('product.update'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }

  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return fail(c, '请选择文件', 400)
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail(c, '不支持的文件格式，仅支持 jpg/png/webp', 400)
  }
  if (file.size > config.uploadMaxBytes) {
    return fail(c, `文件大小不能超过 ${Math.round(config.uploadMaxBytes / 1024 / 1024)}MB`, 400)
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const tmpPath = `/tmp/cshop-product-img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await Bun.write(tmpPath, file)

  try {
    const variants = await processImage(tmpPath)
    const imageUrl = `/api/v1/uploads/${variants.large.path}`

    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: file.name,
      baseName: variants.baseName,
      mimeType: file.type,
      thumbPath: variants.thumb.path,
      smallPath: variants.small.path,
      mediumPath: variants.medium.path,
      largePath: variants.large.path,
      thumbSize: variants.thumb.size,
      smallSize: variants.small.size,
      mediumSize: variants.medium.size,
      largeSize: variants.large.size,
      width: variants.large.width,
      height: variants.large.height
    })

    const [current] = await db.select({ images: products.images }).from(products).where(eq(products.id, id)).limit(1)
    const currentImages = current?.images ? JSON.parse(current.images) : []
    currentImages.push(imageUrl)
    await db.update(products).set({ images: JSON.stringify(currentImages) }).where(eq(products.id, id))
    return success(c, { images: currentImages })
  } finally {
    const { unlink } = await import('node:fs/promises')
    await unlink(tmpPath).catch(() => {})
  }
})

app.post('/products/:id/front-image', requirePermission('product.update'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) return fail(c, '商品不存在', 404)

  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return fail(c, '请选择文件', 400)

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) return fail(c, '不支持的文件格式，仅支持 jpg/png/webp', 400)
  if (file.size > config.uploadMaxBytes) return fail(c, `文件大小不能超过 ${Math.round(config.uploadMaxBytes / 1024 / 1024)}MB`, 400)

  const ext = file.name.split('.').pop() ?? 'bin'
  const tmpPath = `/tmp/cshop-product-img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await Bun.write(tmpPath, file)

  let debgPath: string | null = null
  let maskPath: string | null = null
  let flatPath: string | null = null

  try {
    debgPath = await removeBackground(tmpPath)
    const frontPath = debgPath ?? tmpPath
    maskPath = await generateMask(frontPath)

    flatPath = await flattenOnWhite(frontPath)
    const frontVariants = await processImage(flatPath)
    const maskVariants = await processImage(maskPath)

    const frontUrl = `/api/v1/uploads/${frontVariants.large.path}`
    const maskUrl = `/api/v1/uploads/${maskVariants.large.path}`

    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: file.name,
      baseName: frontVariants.baseName,
      mimeType: file.type,
      thumbPath: frontVariants.thumb.path,
      smallPath: frontVariants.small.path,
      mediumPath: frontVariants.medium.path,
      largePath: frontVariants.large.path,
      thumbSize: frontVariants.thumb.size,
      smallSize: frontVariants.small.size,
      mediumSize: frontVariants.medium.size,
      largeSize: frontVariants.large.size,
      width: frontVariants.large.width,
      height: frontVariants.large.height
    })

    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: `mask-${file.name}`,
      baseName: maskVariants.baseName,
      mimeType: 'image/png',
      thumbPath: maskVariants.thumb.path,
      smallPath: maskVariants.small.path,
      mediumPath: maskVariants.medium.path,
      largePath: maskVariants.large.path,
      thumbSize: maskVariants.thumb.size,
      smallSize: maskVariants.small.size,
      mediumSize: maskVariants.medium.size,
      largeSize: maskVariants.large.size,
      width: maskVariants.large.width,
      height: maskVariants.large.height
    })

    const now = sql`datetime('now')`
    const [existingBase] = await db.select({ id: productBaseDesigns.id }).from(productBaseDesigns).where(eq(productBaseDesigns.productId, id)).limit(1)
    if (existingBase) {
      await db.update(productBaseDesigns).set({ frontImage: frontUrl, maskImage: maskUrl, updatedAt: now }).where(eq(productBaseDesigns.id, existingBase.id))
    } else {
      await db.insert(productBaseDesigns).values({ productId: id, frontImage: frontUrl, maskImage: maskUrl, createdAt: now, updatedAt: now })
    }
    return success(c, { frontImage: frontUrl, maskImage: maskUrl })
  } finally {
    const { unlink } = await import('node:fs/promises')
    await unlink(tmpPath).catch(() => {})
    if (debgPath) await unlink(debgPath).catch(() => {})
    if (maskPath) await unlink(maskPath).catch(() => {})
    if (flatPath) await unlink(flatPath).catch(() => {})
  }
})

app.get('/products/:id/base-design', requirePermission('product.read'), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const [design] = await db.select().from(productBaseDesigns).where(eq(productBaseDesigns.productId, productId)).limit(1)
  return success(c, design ?? null)
})

app.post('/products/:id/base-design', requirePermission('product.update'), async (c) => {
  const productId = parseInt(c.req.param('id'))

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1)
  if (!existing) return fail(c, '商品不存在', 404)

  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return fail(c, '请选择文件', 400)

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) return fail(c, '不支持的文件格式，仅支持 jpg/png/webp', 400)
  if (file.size > config.uploadMaxBytes) return fail(c, `文件大小不能超过 ${Math.round(config.uploadMaxBytes / 1024 / 1024)}MB`, 400)

  const ext = file.name.split('.').pop() ?? 'bin'
  const tmpPath = `/tmp/cshop-base-design-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await Bun.write(tmpPath, file)

  let debgPath: string | null = null
  let maskPath: string | null = null
  let flatPath: string | null = null

  try {
    const originalVariants = await processImage(tmpPath)
    const originalUrl = `/api/v1/uploads/${originalVariants.large.path}`
    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: file.name,
      baseName: originalVariants.baseName,
      mimeType: file.type,
      thumbPath: originalVariants.thumb.path,
      smallPath: originalVariants.small.path,
      mediumPath: originalVariants.medium.path,
      largePath: originalVariants.large.path,
      thumbSize: originalVariants.thumb.size,
      smallSize: originalVariants.small.size,
      mediumSize: originalVariants.medium.size,
      largeSize: originalVariants.large.size,
      width: originalVariants.large.width,
      height: originalVariants.large.height
    })

    debgPath = await removeBackground(tmpPath)
    const frontPath = debgPath ?? tmpPath

    flatPath = await flattenOnWhite(frontPath)
    const frontVariants = await processImage(flatPath)
    const frontUrl = `/api/v1/uploads/${frontVariants.large.path}`
    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: file.name,
      baseName: frontVariants.baseName,
      mimeType: file.type,
      thumbPath: frontVariants.thumb.path,
      smallPath: frontVariants.small.path,
      mediumPath: frontVariants.medium.path,
      largePath: frontVariants.large.path,
      thumbSize: frontVariants.thumb.size,
      smallSize: frontVariants.small.size,
      mediumSize: frontVariants.medium.size,
      largeSize: frontVariants.large.size,
      width: frontVariants.large.width,
      height: frontVariants.large.height
    })

    maskPath = await generateMask(frontPath)
    const maskVariants = await processImage(maskPath)
    const maskUrl = `/api/v1/uploads/${maskVariants.large.path}`
    await db.insert(uploads).values({
      userId: c.get('userId'),
      originalName: `mask-${file.name}`,
      baseName: maskVariants.baseName,
      mimeType: 'image/png',
      thumbPath: maskVariants.thumb.path,
      smallPath: maskVariants.small.path,
      mediumPath: maskVariants.medium.path,
      largePath: maskVariants.large.path,
      thumbSize: maskVariants.thumb.size,
      smallSize: maskVariants.small.size,
      mediumSize: maskVariants.medium.size,
      largeSize: maskVariants.large.size,
      width: maskVariants.large.width,
      height: maskVariants.large.height
    })

    const now = sql`datetime('now')`
    const [existingBase] = await db.select({ id: productBaseDesigns.id }).from(productBaseDesigns).where(eq(productBaseDesigns.productId, productId)).limit(1)
    if (existingBase) {
      await db.update(productBaseDesigns).set({
        originalImage: originalUrl,
        frontImage: frontUrl,
        maskImage: maskUrl,
        updatedAt: now
      }).where(eq(productBaseDesigns.id, existingBase.id))
    } else {
      await db.insert(productBaseDesigns).values({
        productId,
        originalImage: originalUrl,
        frontImage: frontUrl,
        maskImage: maskUrl,
        createdAt: now,
        updatedAt: now
      })
    }
    const [design] = await db.select().from(productBaseDesigns).where(eq(productBaseDesigns.productId, productId)).limit(1)
    return success(c, design, 201)
  } catch (err: any) {
    return fail(c, err.message || '服务器内部错误', 500)
  } finally {
    const { unlink } = await import('node:fs/promises')
    await unlink(tmpPath).catch(() => {})
    if (debgPath) await unlink(debgPath).catch(() => {})
    if (maskPath) await unlink(maskPath).catch(() => {})
    if (flatPath) await unlink(flatPath).catch(() => {})
  }
})

app.delete('/products/:id/base-design', requirePermission('product.update'), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const [existing] = await db.select({ id: productBaseDesigns.id }).from(productBaseDesigns).where(eq(productBaseDesigns.productId, productId)).limit(1)
  if (!existing) return fail(c, '底款设计图不存在', 404)
  await db.delete(productBaseDesigns).where(eq(productBaseDesigns.id, existing.id))
  return success(c, null)
})

app.delete('/products/:id', requirePermission('product.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }
  await db.update(products).set({ deletedAt: sql`datetime('now')` }).where(eq(products.id, id))
  return success(c, null)
})

app.post('/products/:id/restore', requirePermission('product.update'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }
  await db.update(products).set({ deletedAt: null }).where(eq(products.id, id))
  return success(c, null)
})

async function checkProductReferences(ids: number[]): Promise<{ referenced: number[] }> {
  const referenced: number[] = []
  for (const id of ids) {
    const [orderRef] = await db.select({ n: count() }).from(orderItems).where(eq(orderItems.productId, id))
    const [cartRef] = await db.select({ n: count() }).from(cartItems).where(eq(cartItems.productId, id))
    const [designRef] = await db.select({ n: count() }).from(designs).where(eq(designs.productId, id))
    if (orderRef.n > 0 || cartRef.n > 0 || designRef.n > 0) {
      referenced.push(id)
    }
  }
  return { referenced }
}

app.post('/products/:id/permanent', requirePermission('product.hardDelete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!existing) {
    return fail(c, '商品不存在', 404)
  }
  const { referenced } = await checkProductReferences([id])
  if (referenced.length > 0) {
    return fail(c, '该商品有订单/购物车/设计记录，无法彻底删除', 409)
  }
  await db.delete(products).where(eq(products.id, id))
  return success(c, null)
})

app.post('/products/batch-delete', requirePermission('product.delete'), validateJson(productBatchDeleteSchema), async (c) => {
  const { ids } = c.req.valid('json')
  await db.update(products).set({ deletedAt: sql`datetime('now')` }).where(inArray(products.id, ids))
  return success(c, { count: ids.length })
})

app.post('/products/batch-permanent', requirePermission('product.hardDelete'), validateJson(productBatchDeleteSchema), async (c) => {
  const { ids } = c.req.valid('json')
  const { referenced } = await checkProductReferences(ids)
  if (referenced.length > 0) {
    return fail(c, `选中商品中有 ${referenced.length} 个有订单/购物车/设计记录，无法彻底删除`, 409)
  }
  await db.delete(products).where(inArray(products.id, ids))
  return success(c, { count: ids.length })
})

app.get('/products/:id/variants', requirePermission('product.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const items = await db.select().from(productVariants).where(eq(productVariants.productId, id))
  return success(c, { items })
})

app.post('/products/:id/variants', requirePermission('product.create'), validateJson(productVariantSchema), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  const [record] = await db.insert(productVariants).values({ ...data, productId }).returning()
  return success(c, record, 201)
})

app.put('/products/:productId/variants/:variantId', requirePermission('product.update'), validateJson(productVariantSchema), async (c) => {
  const variantId = parseInt(c.req.param('variantId'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1)
  if (!existing) {
    return fail(c, '规格不存在', 404)
  }

  await db.update(productVariants).set(data).where(eq(productVariants.id, variantId))
  return success(c, null)
})

app.delete('/products/:productId/variants/:variantId', requirePermission('product.delete'), async (c) => {
  const variantId = parseInt(c.req.param('variantId'))

  const [{ n: refCount }] = await db
    .select({ n: count() })
    .from(orderItems)
    .where(eq(orderItems.variantId, variantId))
  const [{ n: cartRefCount }] = await db
    .select({ n: count() })
    .from(cartItems)
    .where(eq(cartItems.variantId, variantId))
  const [{ n: designRefCount }] = await db
    .select({ n: count() })
    .from(designs)
    .where(eq(designs.variantId, variantId))

  if (refCount + cartRefCount + designRefCount > 0) {
    return fail(c, '该规格已被订单/购物车/设计引用，无法删除', 409)
  }

  await db.delete(productVariants).where(eq(productVariants.id, variantId))
  return success(c, null)
})

app.post('/products/:id/variants/batch-delete', requirePermission('product.delete'), validateJson(variantBatchDeleteSchema), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const { ids } = c.req.valid('json')

  const refRows = db
    .select({ id: orderItems.variantId, n: count() })
    .from(orderItems)
    .where(inArray(orderItems.variantId, ids))
    .groupBy(orderItems.variantId)
    .all()
  const cartRows = db
    .select({ id: cartItems.variantId, n: count() })
    .from(cartItems)
    .where(inArray(cartItems.variantId, ids))
    .groupBy(cartItems.variantId)
    .all()
  const designRows = db
    .select({ id: designs.variantId, n: count() })
    .from(designs)
    .where(inArray(designs.variantId, ids))
    .groupBy(designs.variantId)
    .all()

  const blocked = new Set<number>()
  refRows.forEach(r => { if (r.id != null && r.n > 0) blocked.add(r.id) })
  cartRows.forEach(r => { if (r.id != null && r.n > 0) blocked.add(r.id) })
  designRows.forEach(r => { if (r.id != null && r.n > 0) blocked.add(r.id) })

  const deletable = ids.filter(id => !blocked.has(id))
  if (deletable.length === 0) {
    return fail(c, '所选规格均已被订单/购物车/设计引用，无法删除', 409)
  }

  db.delete(productVariants).where(inArray(productVariants.id, deletable)).run()

  if (blocked.size > 0) {
    return success(c, { deleted: deletable.length, skipped: Array.from(blocked) })
  }
  return success(c, { deleted: deletable.length, skipped: [] })
})

app.post('/products/:id/variants/batch-update', requirePermission('product.update'), validateJson(variantBatchUpdateSchema), async (c) => {
  const { ids, data } = c.req.valid('json')
  db.update(productVariants).set(data).where(inArray(productVariants.id, ids)).run()
  return success(c, { updated: ids.length })
})

// 商品级规格选项
app.get('/products/:id/variant-options', requirePermission('product.read'), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const type = c.req.query('type') as 'material' | 'weight' | 'size' | 'color' | undefined
  const conditions = type
    ? and(eq(productVariantOptions.productId, productId), eq(productVariantOptions.type, type))
    : eq(productVariantOptions.productId, productId)
  const items = db.select().from(productVariantOptions)
    .where(conditions)
    .orderBy(asc(productVariantOptions.sort), asc(productVariantOptions.id))
    .all()
  return success(c, { items })
})

app.post('/products/:id/variant-options', requirePermission('product.update'), validateJson(productVariantOptionSchema), async (c) => {
  const productId = parseInt(c.req.param('id'))
  const [exists] = db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1).all()
  if (!exists) return fail(c, '商品不存在', 404)
  const data = c.req.valid('json')
  const [record] = db.insert(productVariantOptions).values({
    productId,
    type: data.type,
    value: data.value,
    sort: data.sort ?? 0
  }).returning().all()
  return success(c, record, 201)
})

app.put('/products/:productId/variant-options/:optionId', requirePermission('product.update'), validateJson(productVariantOptionUpdateSchema), async (c) => {
  const optionId = parseInt(c.req.param('optionId'))
  const data = c.req.valid('json')
  const [existing] = db.select({ id: productVariantOptions.id }).from(productVariantOptions).where(eq(productVariantOptions.id, optionId)).limit(1).all()
  if (!existing) return fail(c, '选项不存在', 404)
  db.update(productVariantOptions).set(data).where(eq(productVariantOptions.id, optionId)).run()
  return success(c, null)
})

app.delete('/products/:productId/variant-options/:optionId', requirePermission('product.update'), async (c) => {
  const optionId = parseInt(c.req.param('optionId'))
  const [existing] = db.select({ id: productVariantOptions.id }).from(productVariantOptions).where(eq(productVariantOptions.id, optionId)).limit(1).all()
  if (!existing) return fail(c, '选项不存在', 404)
  db.delete(productVariantOptions).where(eq(productVariantOptions.id, optionId)).run()
  return success(c, null)
})

app.get('/orders', requirePermission('order.read'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit
  const status = c.req.query('status')
  const q = c.req.query('q')?.trim()

  const conditions = []
  if (status) conditions.push(eq(orders.status, status as typeof orders.$inferSelect.status))
  if (q) {
    const escaped = q.replace(/[\\%_]/g, ch => '\\' + ch)
    const pattern = '%' + escaped + '%'
    conditions.push(sql`(
      printf('%05d', ${orders.id}) LIKE ${pattern} ESCAPE '\\'
      OR ${users.name} LIKE ${pattern} ESCAPE '\\'
      OR ${users.email} LIKE ${pattern} ESCAPE '\\'
      OR ${orders.trackingNo} LIKE ${pattern} ESCAPE '\\'
    )`)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rawItems, [{ n: total }]] = await Promise.all([
    db.select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      total: orders.total,
      address: orders.address,
      paidAt: orders.paidAt,
      shippedAt: orders.shippedAt,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
      trackingNo: orders.trackingNo,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(where)
      .orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(where)
  ])

  const ids = rawItems.map(o => o.id)
  const itemCounts: Record<number, number> = {}
  if (ids.length > 0) {
    const counts = await db.select({
      orderId: orderItems.orderId,
      n: count(),
    }).from(orderItems).where(inArray(orderItems.orderId, ids)).groupBy(orderItems.orderId)
    for (const c of counts) { itemCounts[c.orderId] = c.n }
  }

  const items = rawItems.map(o => ({
    ...o,
    orderNo: `ORD-${String(o.id).padStart(5, '0')}`,
    userName: o.userName ?? '未知用户',
    itemCount: itemCounts[o.id] ?? 0,
  }))

  return success(c, { items, total, page, limit })
})

app.get('/orders/:id', requirePermission('order.read'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      total: orders.total,
      address: orders.address,
      paidAt: orders.paidAt,
      shippedAt: orders.shippedAt,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
      trackingNo: orders.trackingNo,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1)

  if (!order) {
    return fail(c, '订单不存在', 404)
  }

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      designId: orderItems.designId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productName: products.name,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))

  return success(c, { ...order, items })
})

app.put('/orders/:id', requirePermission('order.update_status'), validateJson(orderStatusSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!existing) {
    return fail(c, '订单不存在', 404)
  }

  if (!canTransition(existing.status, data.status)) {
    return fail(c, `订单状态不能从 ${existing.status} 变更为 ${data.status}`, 400)
  }

  const now = new Date().toISOString()
  const statusTimestamp: Partial<{
    paidAt: string; shippedAt: string; completedAt: string; cancelledAt: string
    trackingNo: string
  }> = {}
  if (data.trackingNo !== undefined) statusTimestamp.trackingNo = data.trackingNo

  if (data.status === 'cancelled' && existing.status !== 'cancelled') {
    statusTimestamp.cancelledAt = now
    db.transaction((tx) => {
      tx.update(orders)
        .set({ status: 'cancelled', updatedAt: now, ...statusTimestamp })
        .where(eq(orders.id, id))
        .run()

      const items = tx.select().from(orderItems).where(eq(orderItems.orderId, id)).all()
      for (const item of items) {
        if (item.variantId !== null) {
          tx.update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(eq(productVariants.id, item.variantId))
            .run()
        } else {
          tx.update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId))
            .run()
        }
      }
    })
  } else {
    if (data.status === 'paid' && !existing.paidAt) statusTimestamp.paidAt = now
    if (data.status === 'shipped' && !existing.shippedAt) statusTimestamp.shippedAt = now
    if (data.status === 'completed' && !existing.completedAt) statusTimestamp.completedAt = now

    await db
      .update(orders)
      .set({ status: data.status, updatedAt: now, ...statusTimestamp })
      .where(eq(orders.id, id))
  }

  const userId = c.get('userId')
  trackBusinessEvent({
    c,
    userId,
    eventType: 'admin_action',
    metadata: { target: 'order', targetId: id, action: 'status_change', status: data.status }
  })

  return success(c, null)
})

app.route('/backup', backupRoutes)
app.route('/stickers', adminStickerRoutes)
app.route('/categories', adminCategoryRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/settings', settingsRoutes)
app.route('/staff', staffRoutes)
app.route('/roles', rolesRoutes)
app.route('/users', usersRoutes)
app.route('/uploads', uploadsRoutes)
app.route('/menus', menusRoutes)
app.route('/variant-options', adminVariantOptionsRoutes)
app.route('/home-sections', homeRoutes)
app.route('/design-configs', designConfigRoutes)
app.route('/inventory', inventoryRoutes)

export default app
