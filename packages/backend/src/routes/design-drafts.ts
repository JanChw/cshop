import { Hono } from 'hono'
import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { db } from '../db'
import { designDrafts } from '../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { designDraftSchema } from '../validators'
import { config } from '../config'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import { parsePagination } from '../utils/request'
import type { AppEnv } from '../types/hono'

const PREVIEW_WIDTH = 400
const PREVIEW_HEIGHT = 500

function versionPreviewUrl(previewImage: string | null, updatedAt: string | null): string | null {
  if (!previewImage || !updatedAt) return previewImage
  const ts = Date.parse(updatedAt)
  if (Number.isNaN(ts)) return previewImage
  return `${previewImage}?v=${ts}`
}

async function persistPreview(draftId: number, dataUrl: string | null | undefined): Promise<string | null> {
  if (!dataUrl) return null
  const match = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  const buffer = Buffer.from(match[1], 'base64')
  await mkdir(config.designDir, { recursive: true })
  const filename = `draft-${draftId}.webp`
  await sharp(buffer)
    .resize(PREVIEW_WIDTH, PREVIEW_HEIGHT, { fit: 'contain', background: { r: 250, g: 249, b: 246, alpha: 0 } })
    .webp({ quality: 82 })
    .toFile(join(config.designDir, filename))
  return `/api/v1/design-drafts/${draftId}/preview`
}

// Public sub-app: serves preview images without auth.
const publicApp = new Hono()

publicApp.get('/:id/preview', async (c) => {
  const id = parseInt(c.req.param('id'))
  const filename = `draft-${id}.webp`
  if (!isSafeFilename(filename)) return fail(c, '非法文件名', 400)
  const path = join(config.designDir, filename)
  const file = Bun.file(path)
  if (!await file.exists()) return fail(c, '预览不存在', 404)
  return new Response(file, {
    headers: {
      'Content-Type': mimeFromFilename(filename),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  })
})

// Protected sub-app: requires auth, handles CRUD operations.
const protectedApp = new Hono<AppEnv>()
protectedApp.use('*', auth)

protectedApp.get('/', async (c) => {
  const userId = c.get('userId')
  const productId = c.req.query('productId')
  const { page, limit, offset } = parsePagination(c)
  const conditions = [eq(designDrafts.userId, userId)]
  if (productId) {
    const pid = parseInt(productId)
    if (Number.isFinite(pid)) {
      conditions.push(eq(designDrafts.productId, pid))
    }
  }
  const where = and(...conditions)

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select({
        id: designDrafts.id,
        userId: designDrafts.userId,
        productId: designDrafts.productId,
        variantId: designDrafts.variantId,
        name: designDrafts.name,
        previewImage: designDrafts.previewImage,
        createdAt: designDrafts.createdAt,
        updatedAt: designDrafts.updatedAt
      })
      .from(designDrafts)
      .where(where)
      .orderBy(desc(designDrafts.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ n: sql<number>`count(*)` }).from(designDrafts).where(where)
  ])

  return success(c, { items: items.map(d => ({ ...d, previewImage: versionPreviewUrl(d.previewImage, d.updatedAt) })), total, page, limit })
})

protectedApp.post('/', validateJson(designDraftSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')
  const [record] = await db.insert(designDrafts).values({ ...data, userId }).returning()
  if (!record) return fail(c, '创建草稿失败', 500)

  const previewUrl = await persistPreview(record.id, data.previewImage)
  if (previewUrl) {
    await db.update(designDrafts).set({ previewImage: previewUrl }).where(eq(designDrafts.id, record.id))
    record.previewImage = previewUrl
  }

  return success(c, record, 201)
})

protectedApp.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [draft] = await db
    .select()
    .from(designDrafts)
    .where(and(eq(designDrafts.id, id), eq(designDrafts.userId, userId)))
    .limit(1)

  if (!draft) {
    return fail(c, '草稿不存在', 404)
  }
  return success(c, { ...draft, previewImage: versionPreviewUrl(draft.previewImage, draft.updatedAt) })
})

protectedApp.put('/:id', validateJson(designDraftSchema), async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: designDrafts.id })
    .from(designDrafts)
    .where(and(eq(designDrafts.id, id), eq(designDrafts.userId, userId)))
    .limit(1)
  if (!existing) {
    return fail(c, '草稿不存在', 404)
  }

  const previewUrl = await persistPreview(id, data.previewImage)
  const updateData = { ...data, updatedAt: new Date().toISOString() }
  if (previewUrl) updateData.previewImage = previewUrl

  await db
    .update(designDrafts)
    .set(updateData)
    .where(and(eq(designDrafts.id, id), eq(designDrafts.userId, userId)))

  return success(c, { previewImage: previewUrl })
})

protectedApp.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [existing] = await db
    .select({ id: designDrafts.id })
    .from(designDrafts)
    .where(and(eq(designDrafts.id, id), eq(designDrafts.userId, userId)))
    .limit(1)
  if (!existing) return fail(c, '草稿不存在', 404)

  await db.delete(designDrafts).where(eq(designDrafts.id, id))
  await unlink(join(config.designDir, `draft-${id}.webp`)).catch(() => {})

  return success(c, null)
})

// Mount on a single Hono app so they share the /api/v1/design-drafts prefix.
const app = new Hono()
app.route('/', publicApp)
app.route('/', protectedApp)

export default app
