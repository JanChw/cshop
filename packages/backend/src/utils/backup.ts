import { Database } from 'bun:sqlite'
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { rename, unlink } from 'node:fs/promises'
import { isSafeFilename } from './safePath'
import { config } from '../config'

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/:/g, '-').replace(/\..+/, '')
}

// Create a SQLite backup at $BACKUP_DIR/backup-{timestamp}.db.
// Writes to a *.tmp file first, then atomically renames so that a partial
// backup can never be observed by readers.
export async function createBackup(): Promise<{ filename: string; size: number }> {
  mkdirSync(config.backupDir, { recursive: true })

  const timestamp = formatTimestamp(new Date())
  const filename = `backup-${timestamp}.db`
  const finalPath = `${config.backupDir}/${filename}`
  const tmpPath = `${finalPath}.tmp`

  const sourceDb = new Database(config.dbPath)
  try {
    // VACUUM INTO requires a literal path. Path is fully program-derived
    // (timestamp + config dir), no user input -> no injection risk, but we
    // still escape single quotes defensively.
    const escaped = tmpPath.replace(/'/g, "''")
    sourceDb.exec(`VACUUM INTO '${escaped}'`)
  } finally {
    sourceDb.close()
  }

  await rename(tmpPath, finalPath)
  const file = Bun.file(finalPath)
  const size = file.size
  return { filename, size }
}

export async function deleteBackupFile(filename: string): Promise<void> {
  if (!isSafeFilename(filename)) return
  await unlink(`${config.backupDir}/${filename}`).catch(() => {})
}

// Restore the main database from a previously created backup file.
// Creates a safety copy of the current DB first so the operator can recover
// if the restore target is itself corrupt. Throws on missing/invalid file.
export function restoreBackup(filename: string): void {
  if (!isSafeFilename(filename)) {
    throw new Error('非法的备份文件名')
  }
  const backupPath = `${config.backupDir}/${filename}`
  if (!existsSync(backupPath)) {
    throw new Error('备份文件不存在')
  }

  const ts = formatTimestamp(new Date())
  const safetyPath = `${config.backupDir}/pre-restore-${ts}.db`
  copyFileSync(config.dbPath, safetyPath)

  copyFileSync(backupPath, config.dbPath)
}
