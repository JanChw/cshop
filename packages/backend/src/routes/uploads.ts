import { Hono } from 'hono'
import { unlink } from 'node:fs/promises'
import { db } from '../db'
import { uploads } from '../db/schema'
import { auth } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { success, fail } from '../utils/response'
import { acceptImageUpload, uploadErrorPayload } from '../utils/upload'
import { isSafeFilename, isSafeBucket } from '../utils/safePath'
import { mimeFromFilename } from '../utils/mime'
import { trackBusinessEvent } from '../utils/track'
import { config } from '../config'
import { eq, and, desc, count, sql, isNull } from 'drizzle-orm'
import type { AppEnv } from '../types/hono'

const NO_SNIFF = { 'X-Content-Type-Options': 'nosniff' }

// Public sub-app: serves uploaded files without auth.
// New bucketed layout: GET /:bucket/:filename
// Legacy flat layout:  GET /:filename  (kept so files not yet migrated and
// existing external URLs keep resolving).
const publicApp = new Hono()

publicApp.get('/:bucket/:filename', async (c) => {
  const bucket = c.req.param('bucket')
  const filename = c.req.param('filename')
  if (!isSafeBucket(bucket) || !isSafeFilename(filename)) {
    return fail(c, '非法文件名', 400)
  }
  const file = Bun.file(`${config.uploadDir}/${bucket}/${filename}`)
  if (!await file.exists()) {
    return fail(c, '文件不存在', 404)
  }
  return new Response(file, {
    headers: {
      'Content-Type': mimeFromFilename(filename),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...NO_SNIFF
    }
  })
})

publicApp.get('/:filename', async (c) => {
  const filename = c.req.param('filename')
  if (!isSafeFilename(filename)) {
    return fail(c, '非法文件名', 400)
  }
  const file = Bun.file(`${config.uploadDir}/${filename}`)
  if (!await file.exists()) {
    return fail(c, '文件不存在', 404)
  }
  return new Response(file, {
    headers: {
      'Content-Type': mimeFromFilename(filename),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...NO_SNIFF
    }
  })
})

// Protected sub-app: requires auth, handles uploads (POST /).
const protectedApp = new Hono<AppEnv>()
protectedApp.use('*', auth)

// 30 uploads / minute / IP — prevents storage abuse.
const uploadThrottle = rateLimit({ limit: 30, windowMs: 60_000 })

protectedApp.post('/', uploadThrottle, async (c) => {
  const userId = c.get('userId')!
  const formData = await c.req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return fail(c, '请选择文件')
  }

  let accepted
  try {
    accepted = await acceptImageUpload(file)
  } catch (err) {
    const { message, status } = uploadErrorPayload(err)
    return fail(c, message, status)
  }

  try {
    const variants = accepted.variants

    await db.insert(uploads).values({
      userId,
      originalName: file.name,
      baseName: variants.baseName,
      mimeType: accepted.detectedMime,
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

    trackBusinessEvent({
      c,
      userId,
      eventType: 'upload',
      metadata: { baseName: variants.baseName, width: variants.large.width, height: variants.large.height }
    })

    return success(c, {
      baseName: variants.baseName,
      variants: {
        thumb: { url: `/api/v1/uploads/${variants.thumb.path}`, width: variants.thumb.width, size: variants.thumb.size },
        small: { url: `/api/v1/uploads/${variants.small.path}`, width: variants.small.width, size: variants.small.size },
        medium: { url: `/api/v1/uploads/${variants.medium.path}`, width: variants.medium.width, size: variants.medium.size },
        large: { url: `/api/v1/uploads/${variants.large.path}`, width: variants.large.width, size: variants.large.size }
      }
    }, 201)
  } finally {
    await accepted.cleanup()
  }
})

protectedApp.get('/', async (c) => {
  const userId = c.get('userId')!
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const offset = (page - 1) * limit

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select({
        id: uploads.id,
        originalName: uploads.originalName,
        baseName: uploads.baseName,
        width: uploads.width,
        height: uploads.height,
        thumbUrl: uploads.thumbPath,
        smallUrl: uploads.smallPath,
        mediumUrl: uploads.mediumPath,
        createdAt: uploads.createdAt
      })
      .from(uploads)
      .where(eq(uploads.userId, userId))
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ n: count() }).from(uploads).where(eq(uploads.userId, userId))
  ])

  return success(c, {
    items: items.map(i => ({
      id: i.id,
      originalName: i.originalName,
      baseName: i.baseName,
      width: i.width,
      height: i.height,
      thumbUrl: `/api/v1/uploads/${i.thumbUrl}`,
      smallUrl: `/api/v1/uploads/${i.smallUrl}`,
      mediumUrl: `/api/v1/uploads/${i.mediumUrl}`,
      createdAt: i.createdAt
    })),
    total,
    page,
    limit
  })
})

protectedApp.delete('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))

  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, id), eq(uploads.userId, userId)))
    .limit(1)

  if (!upload) {
    return fail(c, '上传记录不存在', 404)
  }

  for (const path of [upload.thumbPath, upload.smallPath, upload.mediumPath, upload.largePath]) {
    await unlink(`${config.uploadDir}/${path}`).catch(() => {})
  }

  await db.delete(uploads).where(eq(uploads.id, id))
  return success(c, null)
})

// Mount on a single Hono app so they share the /api/v1/uploads prefix.
const app = new Hono()
app.route('/', publicApp)
app.route('/', protectedApp)

export default app
