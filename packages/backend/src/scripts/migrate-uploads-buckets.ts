// One-shot migration: move flat files in uploads/ into 2-char bucket
// subdirectories (uploads/ab/<file>) and rewrite the matching path columns
// in the `uploads` table so existing URLs stay valid.
//
// Run AFTER deploying the bucketed image.ts + uploads route, BEFORE relying
// on it. Idempotent: re-running only re-buckets files that are still flat.
//
//   bun --filter @cshop/backend run scripts/migrate-uploads-buckets.ts
//
// (or: cd packages/backend && bun src/scripts/migrate-uploads-buckets.ts)

import { readdir, stat, rename, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { sqliteDb } from '../db'
import { config } from '../config'

const PATH_COLUMNS = ['thumbPath', 'smallPath', 'mediumPath', 'largePath'] as const

function bucketOf(filename: string): string {
  return filename.slice(0, 2)
}

async function main() {
  const top = await readdir(config.uploadDir).catch(() => [] as string[])
  let movedFiles = 0
  let updatedRows = 0

  for (const name of top) {
    const abs = join(config.uploadDir, name)
    const s = await stat(abs).catch(() => null)
    if (!s || !s.isFile()) continue
    if (!/\.(webp|png|jpg|jpeg)$/i.test(name)) continue

    const bucket = bucketOf(name)
    const bucketDir = join(config.uploadDir, bucket)
    if (!existsSync(bucketDir)) await mkdir(bucketDir, { recursive: true })
    const dest = join(bucketDir, name)
    if (existsSync(dest)) continue
    await rename(abs, dest)
    movedFiles++

    // Rewrite DB rows whose path columns point at the flat name. Use the raw
    // sqlite handle so we can read back `.changes` (drizzle's run() is typed
    // as void for bun-sqlite updates).
    for (const col of PATH_COLUMNS) {
      const res = sqliteDb.prepare(`UPDATE uploads SET ${col} = ? WHERE ${col} = ?`).run(`${bucket}/${name}`, name)
      updatedRows += res.changes
    }
  }

  console.log(`[migrate-uploads-buckets] moved ${movedFiles} files, updated ${updatedRows} path column(s).`)
}

main().catch((err) => {
  console.error('[migrate-uploads-buckets] failed:', err)
  process.exit(1)
})
