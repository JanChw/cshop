import maxmind, { type Reader, type Response } from 'maxmind'
import { config } from '../config'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

let reader: Reader<Response> | null = null
let initPromise: Promise<void> | null = null

export interface GeoResult {
  country: string | null
  region: string | null
  city: string | null
}

export async function initGeo(): Promise<void> {
  if (reader) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    const dbPath = config.geoDbPath
    if (!existsSync(dbPath)) {
      console.log(`[geo] mmdb not found at ${dbPath}, geo lookup disabled`)
      return
    }
    try {
      reader = await maxmind.open<Response>(dbPath)
      console.log('[geo] mmdb loaded')
    } catch (err) {
      console.error('[geo] failed to load mmdb:', err)
    }
  })()

  await initPromise
}

export function lookupGeo(ip: string | undefined | null): GeoResult {
  if (!reader || !ip) return { country: null, region: null, city: null }
  try {
    const result = reader.get(ip) as Record<string, any> | null
    if (!result) return { country: null, region: null, city: null }
    return {
      country: result.country?.iso_code ?? null,
      region: result.subdivisions?.[0]?.names?.en ?? result.subdivisions?.[0]?.iso_code ?? null,
      city: result.city?.names?.en ?? null
    }
  } catch {
    return { country: null, region: null, city: null }
  }
}

export function ensureGeoDir(): void {
  const dir = dirname(config.geoDbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
