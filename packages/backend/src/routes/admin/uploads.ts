import { Hono } from 'hono'
import { unlink } from 'node:fs/promises'
import { db } from '../../db'
import { uploads, users } from '../../db/schema'
import { eq, desc, count, and } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import { parsePagination } from '../../utils/request'
import { config } from '../../config'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('settings.read'), async (c) => {
  const { page, limit, offset } = parsePagination(c)
  const userId = c.req.query('userId')

  const conditions = []
  if (userId) conditions.push(eq(uploads.userId, parseInt(userId)))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [{ n: total }]] = await Promise.all([
    db
      .select({
        id: uploads.id,
        userId: uploads.userId,
        userEmail: users.email,
        userName: users.name,
        originalName: uploads.originalName,
        baseName: uploads.baseName,
        width: uploads.width,
        height: uploads.height,
        thumbPath: uploads.thumbPath,
        createdAt: uploads.createdAt
      })
      .from(uploads)
      .leftJoin(users, eq(uploads.userId, users.id))
      .where(where)
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ n: count() }).from(uploads).where(where)
  ])

  return success(c, {
    items: items.map(i => ({
      id: i.id,
      userId: i.userId,
      userEmail: i.userEmail,
      userName: i.userName,
      originalName: i.originalName,
      baseName: i.baseName,
      width: i.width,
      height: i.height,
      thumbUrl: `/api/v1/uploads/${i.thumbPath}`,
      createdAt: i.createdAt
    })),
    total,
    page,
    limit
  })
})

app.delete('/:id', requirePermission('settings.update'), async (c) => {
  const id = parseInt(c.req.param('id'))

  const [upload] = await db
    .select()
    .from(uploads)
    .where(eq(uploads.id, id))
    .limit(1)

  if (!upload) {
    return fail(c, '上传记录不存在', 404)
  }

  for (const path of [upload.thumbPath, upload.smallPath, upload.mediumPath, upload.largePath]) {
    if (path) await unlink(`${config.uploadDir}/${path}`).catch(() => {})
  }

  await db.delete(uploads).where(eq(uploads.id, id))
  return success(c, null)
})

export default app
