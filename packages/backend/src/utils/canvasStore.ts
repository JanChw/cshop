import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { config } from '../config'

// Canvas JSON is stored on local disk under <designDir>/, in separate
// namespaces so designs and design-drafts (which have independent
// autoincrement id sequences and would collide on id) don't overwrite each
// other. The DB column holds a relative key ("canvas/<id>.json" for designs,
// "drafts/<id>.json" for drafts) so the DB stays portable across data dirs.
// List views skip canvasPath entirely; only the single-fetch reads the file.

export function canvasKey(designId: number): string {
  return `canvas/${designId}.json`
}

export function draftCanvasKey(draftId: number): string {
  return `drafts/${draftId}.json`
}

export function canvasFileFromKey(key: string): string {
  return join(config.designDir, key)
}

export async function writeCanvas(key: string, data: string): Promise<string> {
  const file = canvasFileFromKey(key)
  await mkdir(join(config.designDir, dirname(key)), { recursive: true })
  await writeFile(file, data, 'utf8')
  return key
}

export async function readCanvas(key: string | null): Promise<string | null> {
  if (!key) return null
  const file = canvasFileFromKey(key)
  if (!existsSync(file)) return null
  return readFile(file, 'utf8')
}

export async function removeCanvas(key: string | null): Promise<void> {
  if (!key) return
  await unlink(canvasFileFromKey(key)).catch(() => {})
}
