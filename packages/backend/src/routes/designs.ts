import { Hono } from 'hono'
import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { db } from '../db'
import { designs } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { verifyAccessToken } from '../utils/jwt'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { designSchema } from '../validators'
import { trackBusinessEvent } from '../utils/track'
import { config } from '../config'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import type { AppEnv } from '../types/hono'

const PREVIEW_WIDTH = 400
const PREVIEW_HEIGHT = 500

function versionPreviewUrl(previewImage: string | null, updatedAt: string | null): string | null {
  if (!previewImage || !updatedAt) return previewImage
  const ts = Date.parse(updatedAt)
  if (Number.isNaN(ts)) return previewImage
  return `${previewImage}?v=${ts}`
}

async function persistPreview(designId: number, dataUrl: string | null | undefined): Promise<string | null> {
  if (!dataUrl) return null
  const match = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  const buffer = Buffer.from(match[1], 'base64')
  await mkdir(config.designDir, { recursive: true })
  const filename = `${designId}.webp`
  await sharp(buffer)
    .resize(PREVIEW_WIDTH, PREVIEW_HEIGHT, { fit: 'contain', background: { r: 250, g: 249, b: 246, alpha: 0 } })
    .webp({ quality: 82 })
    .toFile(join(config.designDir, filename))
  return `/api/v1/designs/${designId}/preview`
}

// Public sub-app: serves public design listing and preview images without auth.
const publicApp = new Hono()

publicApp.get('/:id/preview', async (c) => {
  const id = parseInt(c.req.param('id'))
  const filename = `${id}.webp`
  if (!isSafeFilename(filename)) return fail(c, '非法文件名', 400)
  const path = join(config.designDir, filename)
  const file = Bun.file(path)
  if (!await file.exists()) return fail(c, '预览不存在', 404)
  return new Response(file, {
    headers: {
      'Content-Type': mimeFromFilename(filename),
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
})

// Protected sub-app: requires auth, handles CRUD operations.
const protectedApp = new Hono<AppEnv>()
protectedApp.use('*', auth)

protectedApp.post('/', validateJson(designSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')
  const [record] = await db.insert(designs).values({ ...data, userId }).returning()
  if (!record) return fail(c, '创建失败', 500)

  const previewUrl = await persistPreview(record.id, data.previewImage)
  if (previewUrl) {
    await db.update(designs).set({ previewImage: previewUrl }).where(eq(designs.id, record.id))
    record.previewImage = previewUrl
  }

  trackBusinessEvent({
    c,
    userId,
    eventType: 'design_save',
    metadata: { designId: record.id, productId: data.productId }
  })

  return success(c, record, 201)
})

protectedApp.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [design] = await db
    .select()
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)

  if (!design) {
    return fail(c, '设计不存在', 404)
  }
  return success(c, { ...design, previewImage: versionPreviewUrl(design.previewImage, design.updatedAt) })
})

protectedApp.patch('/:id/public', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [existing] = await db
    .select({ id: designs.id, isPublic: designs.isPublic })
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)
  if (!existing) return fail(c, '设计不存在', 404)

  const newValue = !existing.isPublic
  await db
    .update(designs)
    .set({ isPublic: newValue, updatedAt: new Date().toISOString() })
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))

  return success(c, { isPublic: newValue })
})

protectedApp.put('/:id', validateJson(designSchema), async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: designs.id })
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)
  if (!existing) {
    return fail(c, '设计不存在', 404)
  }

  const previewUrl = await persistPreview(id, data.previewImage)
  const updateData = { ...data, updatedAt: new Date().toISOString() }
  if (previewUrl) updateData.previewImage = previewUrl

  await db
    .update(designs)
    .set(updateData)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))

  trackBusinessEvent({
    c,
    userId,
    eventType: 'design_save',
    metadata: { designId: id, productId: data.productId }
  })

  return success(c, { previewImage: previewUrl })
})

protectedApp.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [existing] = await db
    .select({ id: designs.id })
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)
  if (!existing) return fail(c, '设计不存在', 404)

  await db.delete(designs).where(eq(designs.id, id))
  await unlink(join(config.designDir, `${id}.webp`)).catch(() => {})

  trackBusinessEvent({ c, userId, eventType: 'design_delete', metadata: { designId: id } })
  return success(c, null)
})

// Mount on a single Hono app so they share the /api/v1/designs prefix.
const app = new Hono()

// Single list handler: returns user's own designs when authenticated, public designs otherwise.
app.get('/', async (c) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? verifyAccessToken(header.slice(7)) : null

  if (token) {
    const items = await db
      .select()
      .from(designs)
      .where(eq(designs.userId, token.userId))
      .orderBy(desc(designs.updatedAt))
    return success(c, { items: items.map(d => ({ ...d, previewImage: versionPreviewUrl(d.previewImage, d.updatedAt) })) })
  }

  const items = await db
    .select()
    .from(designs)
    .where(eq(designs.isPublic, true))
    .orderBy(desc(designs.updatedAt))
  return success(c, { items: items.map(d => ({ ...d, previewImage: versionPreviewUrl(d.previewImage, d.updatedAt) })) })
})

app.route('/', publicApp)
app.route('/', protectedApp)

export default app
