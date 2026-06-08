import { resolve, dirname } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { config } from '../config'

const DBIP_URL = 'https://download.db-ip.com/free/dbip-city-lite-2025-06.mmdb.gz'
const DBIP_FALLBACK_URL = 'https://download.db-ip.com/free/dbip-city-lite-2025-05.mmdb.gz'

async function download(url: string, outPath: string): Promise<boolean> {
  console.log(`[download-geodb] Downloading from ${url}...`)

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`[download-geodb] HTTP ${res.status} ${res.statusText}`)
      return false
    }

    const gzPath = outPath + '.gz'
    const dir = dirname(outPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const buf = await res.arrayBuffer()
    await Bun.write(gzPath, Buffer.from(buf))
    console.log(`[download-geodb] Downloaded ${gzPath} (${(buf.byteLength / 1024 / 1024).toFixed(1)} MB)`)

    console.log('[download-geodb] Decompressing...')
    const proc = Bun.spawn(['gunzip', '-f', gzPath])
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      console.error('[download-geodb] gunzip failed')
      return false
    }

    console.log(`[download-geodb] Done: ${outPath}`)
    return true
  } catch (err) {
    console.error(`[download-geodb] Error:`, err)
    return false
  }
}

async function main() {
  const outPath = config.geoDbPath
  if (existsSync(outPath)) {
    console.log(`[download-geodb] File already exists at ${outPath}. Delete it first to re-download.`)
    return
  }

  const ok = await download(DBIP_URL, outPath)
  if (!ok) {
    console.log('[download-geodb] Trying fallback URL...')
    await download(DBIP_FALLBACK_URL, outPath)
  }
}

main()
