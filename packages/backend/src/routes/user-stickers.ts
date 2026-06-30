import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'
import { stickers } from '../db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { success, fail } from '../utils/response'
import { parsePagination } from '../utils/request'
import { validateJson } from '../utils/validate'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import { acceptStickerUpload, uploadErrorPayload } from '../utils/upload'
import { config } from '../config'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

const stickerUploadThrottle = rateLimit({ limit: 30, windowMs: 60_000 })

app.get('/', async (c) => {
  const userId = c.get('userId')
  const category = c.req.query('category')
  const { page, limit, offset } = parsePagination(c)
  const cond = category ? and(eq(stickers.userId, userId), eq(stickers.category, category)) : eq(stickers.userId, userId)

  const [rows, [{ n: total }]] = await Promise.all([
    db.select().from(stickers).where(cond).orderBy(desc(stickers.createdAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(stickers).where(cond)
  ])
  const items = rows.map(s => ({
    id: s.id,
    userId: s.userId,
    name: s.name,
    category: s.category,
    imagePath: s.imagePath,
    width: s.width,
    height: s.height,
    createdAt: s.createdAt,
    url: `/api/v1/stickers/${s.imagePath}`
  }))
  return success(c, { items, total, page, limit })
})

app.post('/', stickerUploadThrottle, async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.formData()
  const file = formData.get('file')
  const name = formData.get('name')
  const category = (formData.get('category') as string | null) ?? 'general'

  if (!(file instanceof File) || typeof name !== 'string' || name.length === 0) {
    return fail(c, '缺少文件或名称')
  }

  let accepted
  try {
    accepted = await acceptStickerUpload(file)
  } catch (err) {
    const { message, status } = uploadErrorPayload(err)
    return fail(c, message, status)
  }

  const [record] = await db
    .insert(stickers)
    .values({ name, category, imagePath: accepted.filename, width: accepted.width, height: accepted.height, userId })
    .returning()

  return success(c, {
    id: record.id,
    userId: record.userId,
    name: record.name,
    category: record.category,
    imagePath: record.imagePath,
    width: record.width,
    height: record.height,
    createdAt: record.createdAt,
    url: `/api/v1/stickers/${record.imagePath}`
  }, 201)
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional()
}).refine(d => d.name !== undefined || d.category !== undefined, '至少修改一个字段')

app.put('/:id', validateJson(updateSchema), async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select().from(stickers)
    .where(and(eq(stickers.id, id), eq(stickers.userId, userId)))
    .limit(1)
  if (!existing) {
    return fail(c, '素材不存在', 404)
  }

  await db.update(stickers).set(data).where(eq(stickers.id, id))
  return success(c, null)
})

app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))

  const [sticker] = await db
    .select().from(stickers)
    .where(and(eq(stickers.id, id), eq(stickers.userId, userId)))
    .limit(1)
  if (!sticker) {
    return fail(c, '素材不存在', 404)
  }

  if (isSafeFilename(sticker.imagePath)) {
    const file = Bun.file(`${config.stickerDir}/${sticker.imagePath}`)
    if (await file.exists()) {
      await file.delete()
    }
  }
  await db.delete(stickers).where(eq(stickers.id, id))
  return success(c, null)
})

export default app
