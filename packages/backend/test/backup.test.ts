import { test, expect, describe, beforeEach } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { db } from './helpers/setup'
import { backups } from '../src/db/schema'
import { createUser, createStaff } from './helpers/factories'
import { config } from '../src/config'
import { rmSync, existsSync, readdirSync } from 'node:fs'

beforeEach(() => {
  if (existsSync(config.backupDir)) {
    rmSync(config.backupDir, { recursive: true, force: true })
  }
})

describe('backup creation (A11)', () => {
  test('in-memory db cannot be backed up — fails cleanly without leaving artifacts', async () => {
    // VACUUM INTO from :memory: db is not supported the same way; expect 500
    // and importantly: no orphan record AND no leftover .tmp file in backup dir.
    const admin = await createStaff({ roleName: 'super_admin' })

    const { status } = await api('/api/v1/admin/backup', {
      method: 'POST',
      token: admin.accessToken
    })
    // We don't assert the exact status: we DO assert atomicity:
    // either both row + file exist, or neither.
    const rows = await db.select().from(backups)
    if (rows.length === 0) {
      // Backup failed — no leftover .tmp or .db file should remain.
      const files = existsSync(config.backupDir) ? readdirSync(config.backupDir) : []
      expect(files.length).toBe(0)
    } else {
      // If backup somehow succeeded (Bun version supports it), file must exist.
      expect(status).toBe(201)
      expect(existsSync(`${config.backupDir}/${rows[0].filename}`)).toBe(true)
    }
  })

  test('list backups returns desc by createdAt', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    // Insert directly to avoid file system requirement
    await db.insert(backups).values({ filename: 'b-1.db', size: 100 })
    await new Promise(r => setTimeout(r, 1100))
    await db.insert(backups).values({ filename: 'b-2.db', size: 200 })

    const { body } = await api('/api/v1/admin/backup', { token: admin.accessToken })
    expect(body.data.items[0].filename).toBe('b-2.db')
    expect(body.data.items[1].filename).toBe('b-1.db')
  })

  test('download non-existent id 404', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const { status } = await api('/api/v1/admin/backup/9999/download', {
      token: admin.accessToken
    })
    expect(status).toBe(404)
  })

  test('download with malformed filename in record 500', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const [rec] = await db.insert(backups).values({ filename: '../etc/passwd', size: 1 }).returning()
    const { status } = await api(`/api/v1/admin/backup/${rec.id}/download`, {
      token: admin.accessToken
    })
    expect(status).toBe(500)
  })

  test('non-admin gets 403', async () => {
    const u = await createUser()
    const { status } = await api('/api/v1/admin/backup', {
      method: 'POST',
      token: u.accessToken
    })
    expect(status).toBe(403)
  })

  test('delete record + file', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const [rec] = await db.insert(backups).values({ filename: 'gone.db', size: 1 }).returning()
    const { status } = await api(`/api/v1/admin/backup/${rec.id}`, {
      method: 'DELETE',
      token: admin.accessToken
    })
    expect(status).toBe(200)
    const remaining = await db.select().from(backups)
    expect(remaining.length).toBe(0)
  })
})
