import { Hono } from 'hono'
import { mkdirSync } from 'node:fs'
import { z } from 'zod'
import { db } from '../db'
import { stickers } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import { config } from '../config'
import type { AppEnv } from '../types/hono'

const ALLOWED_STICKER_TYPES = ['image/png', 'image/webp']

const app = new Hono<AppEnv>()
app.use('*', auth)

app.get('/', async (c) => {
  const userId = c.get('userId')
  const category = c.req.query('category')
  const cond = eq(stickers.userId, userId)
  const rows = category
    ? await db.select().from(stickers).where(and(cond, eq(stickers.category, category)))
    : await db.select().from(stickers).where(cond)
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
  return success(c, { items })
})

app.post('/', async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.formData()
  const file = formData.get('file')
  const name = formData.get('name')
  const category = (formData.get('category') as string | null) ?? 'general'

  if (!(file instanceof File) || typeof name !== 'string' || name.length === 0) {
    return fail(c, '缺少文件或名称')
  }
  if (!ALLOWED_STICKER_TYPES.includes(file.type)) {
    return fail(c, '仅支持 png/webp 格式')
  }
  if (file.size > config.stickerMaxBytes) {
    return fail(c, `文件大小不能超过 ${Math.round(config.stickerMaxBytes / 1024 / 1024)}MB`)
  }

  mkdirSync(config.stickerDir, { recursive: true })

  const ext = file.type === 'image/png' ? 'png' : 'webp'
  const filename = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${config.stickerDir}/${filename}`
  await Bun.write(filePath, file)

  let width = 200
  let height = 200
  try {
    const sharp = (await import('sharp')).default
    const meta = await sharp(filePath).metadata()
    if (meta.width) width = meta.width
    if (meta.height) height = meta.height
  } catch {}

  const [record] = await db
    .insert(stickers)
    .values({ name, category, imagePath: filename, width, height, userId })
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
