#!/usr/bin/env bun
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stickers } from './schema'
import { config } from '../config'

interface StickerDef {
  name: string
  category: string
  svgContent: string
}

const STICKERS: StickerDef[] = [
  // recommend
  { name: '爱心', category: 'recommend', svgContent: '<path d="M50 85 C20 60 5 45 5 28 C5 15 15 5 28 5 C38 5 46 12 50 20 C54 12 62 5 72 5 C85 5 95 15 95 28 C95 45 80 60 50 85 Z" fill="#c2652a"/>' },
  { name: '星星', category: 'recommend', svgContent: '<polygon points="50 5 61 35 95 35 68 55 79 85 50 65 21 85 32 55 5 35 39 35" fill="#c2652a"/>' },
  { name: '笑脸', category: 'recommend', svgContent: '<circle cx="50" cy="50" r="45" fill="none" stroke="#c2652a" stroke-width="6"/><circle cx="34" cy="40" r="5" fill="#c2652a"/><circle cx="66" cy="40" r="5" fill="#c2652a"/><path d="M30 60 Q50 78 70 60" fill="none" stroke="#c2652a" stroke-width="6" stroke-linecap="round"/>' },
  { name: '闪电', category: 'recommend', svgContent: '<polygon points="55 5 25 50 45 50 35 95 75 45 55 45" fill="#c2652a"/>' },
  // geometric
  { name: '圆形', category: 'geometric', svgContent: '<circle cx="50" cy="50" r="40" fill="none" stroke="#3a302a" stroke-width="6"/>' },
  { name: '方形', category: 'geometric', svgContent: '<rect x="15" y="15" width="70" height="70" rx="6" fill="none" stroke="#3a302a" stroke-width="6"/>' },
  { name: '三角', category: 'geometric', svgContent: '<polygon points="50 15 85 80 15 80" fill="none" stroke="#3a302a" stroke-width="6" stroke-linejoin="round"/>' },
  { name: '六边', category: 'geometric', svgContent: '<polygon points="50 10 85 30 85 70 50 90 15 70 15 30" fill="none" stroke="#3a302a" stroke-width="6" stroke-linejoin="round"/>' },
  // nature
  { name: '叶子', category: 'nature', svgContent: '<path d="M50 90 Q50 55 20 35 Q50 40 80 35 Q50 55 50 90 Z" fill="#2d4a3e"/><path d="M50 55 L50 80" stroke="#faf5ee" stroke-width="3" stroke-linecap="round"/>' },
  { name: '花朵', category: 'nature', svgContent: '<circle cx="50" cy="50" r="10" fill="#c2652a"/><circle cx="50" cy="25" r="12" fill="#e08850"/><circle cx="75" cy="50" r="12" fill="#e08850"/><circle cx="50" cy="75" r="12" fill="#e08850"/><circle cx="25" cy="50" r="12" fill="#e08850"/>' },
  { name: '太阳', category: 'nature', svgContent: '<circle cx="50" cy="50" r="18" fill="#c2652a"/><g stroke="#c2652a" stroke-width="5" stroke-linecap="round"><line x1="50" y1="12" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="88"/><line x1="12" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="88" y2="50"/><line x1="23" y1="23" x2="30" y2="30"/><line x1="77" y1="77" x2="70" y2="70"/><line x1="77" y1="23" x2="70" y2="30"/><line x1="23" y1="77" x2="30" y2="70"/></g>' },
  { name: '月亮', category: 'nature', svgContent: '<path d="M55 10 A35 35 0 1 1 55 80 A25 25 0 1 0 55 10 Z" fill="#3a302a"/>' },
  // abstract
  { name: '波浪', category: 'abstract', svgContent: '<path d="M10 55 Q25 35 40 55 T70 55 T100 55" fill="none" stroke="#3a302a" stroke-width="6" stroke-linecap="round"/>' },
  { name: '螺旋', category: 'abstract', svgContent: '<path d="M55 50 C55 47 47 47 47 55 C47 65 65 65 65 50 C65 35 35 35 35 55 C35 75 75 75 75 50" fill="none" stroke="#c2652a" stroke-width="6" stroke-linecap="round"/>' },
  { name: '墨点', category: 'abstract', svgContent: '<path d="M50 15 C75 15 90 35 85 55 C80 75 60 90 45 85 C25 80 10 60 15 40 C20 20 35 15 50 15 Z" fill="#3a302a"/>' }
]

async function main() {
  const sharp = (await import('sharp')).default
  const stickerDir = resolve(config.stickerDir)
  mkdirSync(stickerDir, { recursive: true })

  const sqlite = new Database(config.dbPath, { create: true })
  const db = drizzle(sqlite)

  // Check if system stickers already exist
  const existing = sqlite.query('SELECT COUNT(*) as c FROM stickers WHERE user_id IS NULL').get()
  if (existing && (existing as any).c > 0) {
    console.log(`System stickers already seeded (${(existing as any).c} found). Skipping.`)
    process.exit(0)
  }

  console.log(`Seeding ${STICKERS.length} system stickers to ${stickerDir}...`)

  let count = 0
  for (const s of STICKERS) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100">${s.svgContent}</svg>`
    const filename = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    const filepath = resolve(stickerDir, filename)

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(200, 200)
      .png()
      .toBuffer()

    writeFileSync(filepath, pngBuffer)

    await db.insert(stickers).values({
      name: s.name,
      category: s.category,
      imagePath: filename,
      width: 200,
      height: 200
    })

    count++
    console.log(`  [${count}/${STICKERS.length}] ${s.name} (${s.category})`)
  }

  console.log(`\nDone! ${count} stickers seeded.`)
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
