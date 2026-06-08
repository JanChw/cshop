import { Hono } from 'hono'
import { mkdirSync } from 'node:fs'
import { z } from 'zod'
import { db } from '../db'
import { stickers } from '../db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import { config } from '../config'
import type { AppEnv } from '../types/hono'

const ALLOWED_STICKER_TYPES = ['image/png', 'image/webp']

const publicApp = new Hono()

publicApp.get('/', async (c) => {
  const category = c.req.query('category')
  const items = category
    ? await db.select().from(stickers).where(eq(stickers.category, category))
    : await db.select().from(stickers)
  return success(c, { items })
})

publicApp.get('/:filename', async (c) => {
  const filename = c.req.param('filename')
  if (!isSafeFilename(filename)) {
    return fail(c, '非法文件名', 400)
  }
  const file = Bun.file(`${config.stickerDir}/${filename}`)
  if (!await file.exists()) {
    return fail(c, '素材不存在', 404)
  }
  return new Response(file, {
    headers: {
      'Content-Type': mimeFromFilename(filename),
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
})

const adminStickerApp = new Hono<AppEnv>()
adminStickerApp.use('*', auth)
adminStickerApp.use('*', requireStaff)

adminStickerApp.post('/', requirePermission('sticker.create'), async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')
  const name = formData.get('name')
  const category = (formData.get('category') as string | null) ?? 'general'

  if (!(file instanceof File) || typeof name !== 'string' || name.length === 0) {
    return fail(c, '缺少文件或名称')
  }
  if (!ALLOWED_STICKER_TYPES.includes(file.type)) {
    return fail(c, '仅支持 png/webp 格式（svg 因 XSS 风险不再支持）')
  }
  if (file.size > config.stickerMaxBytes) {
    return fail(c, `文件大小不能超过 ${Math.round(config.stickerMaxBytes / 1024 / 1024)}MB`)
  }

  mkdirSync(config.stickerDir, { recursive: true })

  const ext = file.type === 'image/png' ? 'png' : 'webp'
  const filename = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${config.stickerDir}/${filename}`
  await Bun.write(filePath, file)

  const img = Bun.file(filePath)
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
    .values({ name, category, imagePath: filename, width, height })
    .returning()

  return success(c, record, 201)
})

const updateStickerSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional()
}).refine(d => d.name !== undefined || d.category !== undefined, '至少修改一个字段')

adminStickerApp.put('/:id', requirePermission('sticker.update'), validateJson(updateStickerSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db.select().from(stickers).where(eq(stickers.id, id)).limit(1)
  if (!existing) {
    return fail(c, '素材不存在', 404)
  }

  await db.update(stickers).set(data).where(eq(stickers.id, id))
  return success(c, null)
})

adminStickerApp.delete('/:id', requirePermission('sticker.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [sticker] = await db.select().from(stickers).where(eq(stickers.id, id)).limit(1)
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

export { publicApp as stickerRoutes, adminStickerApp as adminStickerRoutes }
