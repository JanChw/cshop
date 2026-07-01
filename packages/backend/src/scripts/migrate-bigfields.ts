// One-shot data migration to run BETWEEN drizzle migrations 0006 and 0007.
//
//   0006 (additive): creates product_images / activity_event_refs /
//     daily_stats / product_daily_views; adds designs.canvas_path and
//     design_drafts.canvas_path; makes both legacy canvas_data columns
//     nullable. Keeps products.images / designs.canvas_data /
//     design_drafts.canvas_data so this script can read them.
//   [this script]: reads the legacy big columns and populates the new
//     normalized tables / files. Idempotent.
//   0007 (drops): drops products.images, designs.canvas_data,
//     design_drafts.canvas_data.
//
// In production: apply 0006 → run this script → apply 0007.
// In tests the migrations auto-apply with empty data so this script is never
// needed.
//
// Reads the legacy columns via raw SQL because at this point schema.ts has
// already been updated to the final shape (no images / canvas_data) while the
// live DB still has them (post-0006, pre-0007).
//
//   bun --filter @cshop/backend run src/scripts/migrate-bigfields.ts

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import { db, sqliteDb } from '../db'
import { designs, designDrafts, productImages, activityEventRefs } from '../db/schema'
import { config } from '../config'

// Canvas JSON lives under <designDir> in separate namespaces:
//   designs       → canvas/<id>.json   (key: "canvas/<id>.json")
//   design-drafts → drafts/<id>.json   (key: "drafts/<id>.json")
// Designs and drafts have independent autoincrement ids and would collide
// if they shared a namespace, so the key encodes the kind.
function designCanvasKey(designId: number): string {
  return `canvas/${designId}.json`
}
function draftCanvasKey(draftId: number): string {
  return `drafts/${draftId}.json`
}
function canvasFileFromKey(key: string): string {
  return join(config.designDir, key)
}

async function migrateProductImages() {
  const rows = sqliteDb.prepare('SELECT id, images FROM products').all() as Array<{ id: number; images: string | null }>
  let inserted = 0
  for (const r of rows) {
    if (!r.images) continue
    let paths: unknown
    try { paths = JSON.parse(r.images) } catch { continue }
    if (!Array.isArray(paths)) continue
    const existing = db.select({ id: productImages.id }).from(productImages)
      .where(eq(productImages.productId, r.id)).limit(1).all()
    if (existing.length > 0) continue
    let sort = 0
    for (const p of paths) {
      if (typeof p !== 'string' || p.length === 0) continue
      db.insert(productImages).values({ productId: r.id, path: p, sort: sort++ }).run()
      inserted++
    }
  }
  console.log(`[migrate-bigfields] product_images: inserted ${inserted} row(s) from ${rows.length} product(s).`)
}

async function migrateDesignsCanvas() {
  const rows = sqliteDb.prepare('SELECT id, canvas_data, canvas_path FROM designs').all() as Array<{ id: number; canvas_data: string | null; canvas_path: string | null }>
  await mkdir(join(config.designDir, 'canvas'), { recursive: true })
  let written = 0
  for (const r of rows) {
    const key = designCanvasKey(r.id)
    if (r.canvas_path === key && existsSync(canvasFileFromKey(key))) continue
    if (!r.canvas_data) continue
    await writeFile(canvasFileFromKey(key), r.canvas_data, 'utf8')
    db.update(designs).set({ canvasPath: key }).where(eq(designs.id, r.id)).run()
    written++
  }
  console.log(`[migrate-bigfields] designs.canvas: wrote ${written} file(s) from ${rows.length} design(s).`)
}

async function migrateDesignDraftsCanvas() {
  const rows = sqliteDb.prepare('SELECT id, canvas_data, canvas_path FROM design_drafts').all() as Array<{ id: number; canvas_data: string | null; canvas_path: string | null }>
  await mkdir(join(config.designDir, 'drafts'), { recursive: true })
  let written = 0
  for (const r of rows) {
    const key = draftCanvasKey(r.id)
    if (r.canvas_path === key && existsSync(canvasFileFromKey(key))) continue
    if (!r.canvas_data) continue
    await writeFile(canvasFileFromKey(key), r.canvas_data, 'utf8')
    db.update(designDrafts).set({ canvasPath: key }).where(eq(designDrafts.id, r.id)).run()
    written++
  }
  console.log(`[migrate-bigfields] design_drafts.canvas: wrote ${written} file(s) from ${rows.length} draft(s).`)
}

async function migrateActivityEventRefs() {
  // Walk the table in chunks; only events with a productId in metadata get a
  // ref row. Uses raw SQL on the metadata column for the reason above.
  const LIMIT = 1000
  let offset = 0
  let inserted = 0
  while (true) {
    const rows = sqliteDb.prepare('SELECT id, metadata FROM activity_events LIMIT ? OFFSET ?')
      .all(LIMIT, offset) as Array<{ id: number; metadata: string | null }>
    if (rows.length === 0) break
    for (const r of rows) {
      if (!r.metadata) continue
      let meta: any
      try { meta = JSON.parse(r.metadata) } catch { continue }
      const productId = typeof meta?.productId === 'number' ? meta.productId : null
      const productName = typeof meta?.productName === 'string' ? meta.productName : null
      if (productId === null && productName === null) continue
      const existing = db.select({ id: activityEventRefs.id }).from(activityEventRefs)
        .where(eq(activityEventRefs.eventId, r.id)).limit(1).all()
      if (existing.length > 0) continue
      db.insert(activityEventRefs).values({ eventId: r.id, productId, productName }).run()
      inserted++
    }
    offset += rows.length
    if (rows.length < LIMIT) break
  }
  console.log(`[migrate-bigfields] activity_event_refs: inserted ${inserted} row(s).`)
}

async function main() {
  await migrateProductImages()
  await migrateDesignsCanvas()
  await migrateDesignDraftsCanvas()
  await migrateActivityEventRefs()
  console.log('[migrate-bigfields] done.')
}

main().catch((err) => {
  console.error('[migrate-bigfields] failed:', err)
  process.exit(1)
})
