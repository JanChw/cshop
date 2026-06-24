import { Hono } from 'hono'
import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { db } from '../db'
import { designDrafts } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { designDraftSchema } from '../validators'
import { config } from '../config'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import type { AppEnv } from '../types/hono'

const PREVIEW_WIDTH = 400
const PREVIEW_HEIGHT = 500

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

const app = new Hono<AppEnv>()
app.use('*', auth)

app.get('/', async (c) => {
  const userId = c.get('userId')
  const productId = c.req.query('productId')
  const conditions = [eq(designDrafts.userId, userId)]
  if (productId) {
    const pid = parseInt(productId)
    if (Number.isFinite(pid)) {
      conditions.push(eq(designDrafts.productId, pid))
    }
  }
  const items = await db
    .select()
    .from(designDrafts)
    .where(and(...conditions))
    .orderBy(desc(designDrafts.updatedAt))

  return success(c, { items })
})

app.post('/', validateJson(designDraftSchema), async (c) => {
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

app.get('/:id', async (c) => {
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
  return success(c, draft)
})

app.get('/:id/preview', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const [draft] = await db
    .select({ id: designDrafts.id })
    .from(designDrafts)
    .where(and(eq(designDrafts.id, id), eq(designDrafts.userId, userId)))
    .limit(1)
  if (!draft) return fail(c, '草稿不存在', 404)

  const filename = `draft-${id}.webp`
  if (!isSafeFilename(filename)) return fail(c, '非法文件名', 400)
  const path = join(config.designDir, filename)
  const file = Bun.file(path)
  if (!await file.exists()) return fail(c, '预览不存在', 404)
  return new Response(file, {
    headers: {
      'Content-Type': mimeFromFilename(filename),
      'Cache-Control': 'private, max-age=300'
    }
  })
})

app.put('/:id', validateJson(designDraftSchema), async (c) => {
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

app.delete('/:id', async (c) => {
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

export default app
