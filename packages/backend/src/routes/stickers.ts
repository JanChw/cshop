import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'
import { stickers } from '../db/schema'
import { eq, and, isNull, like, count } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { requireStaff, requirePermission } from '../middleware/permission'
import { rateLimit } from '../middleware/rateLimit'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { isSafeFilename } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import { acceptStickerUpload, uploadErrorPayload } from '../utils/upload'
import { parsePagination, escapeLikePattern } from '../utils/request'
import { config } from '../config'
import type { AppEnv } from '../types/hono'

const NO_SNIFF = { 'X-Content-Type-Options': 'nosniff' }

const publicApp = new Hono()

publicApp.get('/', async (c) => {
  const category = c.req.query('category')
  const q = c.req.query('q')
  const { page, limit, offset } = parsePagination(c)

  const conds = [isNull(stickers.userId)]
  if (category) conds.push(eq(stickers.category, category))
  if (q) conds.push(like(stickers.name, `%${escapeLikePattern(q)}%`))
  const cond = and(...conds)

  const [totalResult] = await db.select({ value: count() }).from(stickers).where(cond)
  const total = totalResult?.value ?? 0
  const totalPages = Math.ceil(total / limit)

  const rows = await db
    .select()
    .from(stickers)
    .where(cond)
    .limit(limit)
    .offset(offset)

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
  return success(c, { items, total, page, limit, totalPages })
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
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...NO_SNIFF
    }
  })
})

const adminStickerApp = new Hono<AppEnv>()
adminStickerApp.use('*', auth)
adminStickerApp.use('*', requireStaff)

const stickerUploadThrottle = rateLimit({ limit: 30, windowMs: 60_000 })

adminStickerApp.post('/', stickerUploadThrottle, requirePermission('sticker.create'), async (c) => {
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
    .values({ name, category, imagePath: accepted.filename, width: accepted.width, height: accepted.height })
    .returning()

  return success(c, record, 201)
})

adminStickerApp.put('/:id', requirePermission('sticker.update'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [existing] = await db.select().from(stickers).where(eq(stickers.id, id)).limit(1)
  if (!existing) {
    return fail(c, '素材不存在', 404)
  }

  const contentType = c.req.header('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData()
    const name = formData.get('name')
    const category = formData.get('category')
    const file = formData.get('file')
    const updateData: Record<string, string | number> = {}

    if (typeof name === 'string' && name.length > 0) updateData.name = name
    if (typeof category === 'string' && category.length > 0) updateData.category = category

    if (file instanceof File) {
      let accepted
      try {
        accepted = await acceptStickerUpload(file)
      } catch (err) {
        const { message, status } = uploadErrorPayload(err)
        return fail(c, message, status)
      }

      updateData.imagePath = accepted.filename
      updateData.width = accepted.width
      updateData.height = accepted.height

      if (isSafeFilename(existing.imagePath)) {
        const oldFile = Bun.file(`${config.stickerDir}/${existing.imagePath}`)
        if (await oldFile.exists()) {
          await oldFile.delete()
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return fail(c, '至少修改一个字段')
    }

    await db.update(stickers).set(updateData).where(eq(stickers.id, id))
    return success(c, null)
  }

  const jsonSchema = z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional()
  }).refine(d => d.name !== undefined || d.category !== undefined, '至少修改一个字段')

  const parsed = jsonSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return fail(c, '至少修改一个字段')
  }

  await db.update(stickers).set(parsed.data).where(eq(stickers.id, id))
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
