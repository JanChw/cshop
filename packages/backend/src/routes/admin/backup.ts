import { Hono } from 'hono'
import { db } from '../../db'
import { backups } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { createBackup, deleteBackupFile, restoreBackup } from '../../utils/backup'
import { isSafeFilename } from '../../utils/safePath'
import { config } from '../../config'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import type { AppEnv } from '../../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.post('/', requirePermission('backup.create'), async (c) => {
  let filename: string | null = null
  let size = 0
  try {
    const result = await createBackup()
    filename = result.filename
    size = result.size

    const [record] = await db.insert(backups).values({ filename, size }).returning()
    return success(c, record, 201)
  } catch (err) {
    if (filename) {
      await deleteBackupFile(filename).catch(() => {})
    }
    return fail(c, '备份失败: ' + (err as Error).message, 500)
  }
})

app.get('/', requirePermission('backup.create'), async (c) => {
  const items = await db.select().from(backups).orderBy(desc(backups.createdAt))
  return success(c, { items })
})

app.get('/:id/download', requirePermission('backup.download'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [record] = await db.select().from(backups).where(eq(backups.id, id)).limit(1)
  if (!record) {
    return fail(c, '备份不存在', 404)
  }
  if (!isSafeFilename(record.filename)) {
    return fail(c, '备份文件名异常', 500)
  }

  const file = Bun.file(`${config.backupDir}/${record.filename}`)
  if (!await file.exists()) {
    return fail(c, '备份文件不存在', 404)
  }

  return new Response(file, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${record.filename}"`,
      'Cache-Control': 'no-store'
    }
  })
})

app.delete('/:id', requirePermission('backup.delete'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const [record] = await db.select().from(backups).where(eq(backups.id, id)).limit(1)
  if (!record) {
    return fail(c, '备份不存在', 404)
  }

  await deleteBackupFile(record.filename)
  await db.delete(backups).where(eq(backups.id, id))
  return success(c, null)
})

// Restore the main database from a known backup record.
// DANGER: this replaces the live DB; requires explicit confirmation flag.
app.post('/:id/restore', requirePermission('backup.create'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const confirmed = c.req.query('confirm') === 'yes'

  const [record] = await db.select().from(backups).where(eq(backups.id, id)).limit(1)
  if (!record) {
    return fail(c, '备份不存在', 404)
  }
  if (!confirmed) {
    return fail(c, '需要 ?confirm=yes 参数确认', 400)
  }

  try {
    restoreBackup(record.filename)
  } catch (err) {
    return fail(c, '恢复失败: ' + (err as Error).message, 500)
  }

  return success(c, { restored: record.filename, note: '服务需要重启以加载恢复后的数据库' })
})

export default app
