import { db } from './db'
import { backups } from './db/schema'
import { createBackup, deleteBackupFile } from './utils/backup'

const ONE_DAY_MS = 24 * 3600 * 1000

async function runBackup(): Promise<void> {
  let createdFile: string | null = null
  try {
    const { filename, size } = await createBackup()
    createdFile = filename
    await db.insert(backups).values({ filename, size })
    console.log(`Auto backup created: ${filename} (${(size / 1024).toFixed(1)}KB)`)
  } catch (err) {
    if (createdFile) {
      await deleteBackupFile(createdFile).catch(() => {})
    }
    console.error('Auto backup failed:', err)
  }
}

// Schedules a daily backup at 03:00 local time. setTimeout aligns the first
// run to the next 3am, then setInterval repeats every 24h. Note: across DST
// or sleep events the trigger may drift by an hour; acceptable for backups.
export function scheduleAutoBackup(): void {
  const now = new Date()
  const next3am = new Date(now)
  next3am.setHours(3, 0, 0, 0)
  if (next3am <= now) {
    next3am.setDate(next3am.getDate() + 1)
  }

  const msUntil3am = next3am.getTime() - now.getTime()
  console.log(`Auto backup scheduled at ${next3am.toISOString()} (${Math.round(msUntil3am / 3600000)}h from now)`)

  setTimeout(() => {
    void runBackup()
    setInterval(() => { void runBackup() }, ONE_DAY_MS)
  }, msUntil3am)
}
