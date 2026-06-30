import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import * as schema from './schema'
import { config } from '../config'

// Ensure parent directory exists (no-op for ":memory:" since dirname is ".")
if (config.dbPath !== ':memory:') {
  mkdirSync(dirname(config.dbPath), { recursive: true })
}

const sqlite = new Database(config.dbPath, { create: true })
sqlite.exec('PRAGMA journal_mode=WAL')
sqlite.exec('PRAGMA foreign_keys=ON')
// WAL mode + NORMAL synchronous: 2-10x faster commits, crash loses at most
// the last few transactions (acceptable for an e-commerce app with event
// queue buffering).
sqlite.exec('PRAGMA synchronous=NORMAL')
// Wait up to 5s on write-lock contention instead of throwing SQLITE_BUSY
// immediately (event flush + request handler can race on the same DB).
sqlite.exec('PRAGMA busy_timeout=5000')
// 64MB page cache (default 2MB is too small for analytics queries).
sqlite.exec('PRAGMA cache_size=-65536')
// Memory-map up to 256MB of the DB for zero-copy reads.
sqlite.exec('PRAGMA mmap_size=268435456')
// GROUP BY / ORDER BY temp tables in memory, not on disk.
sqlite.exec('PRAGMA temp_store=MEMORY')

export const db = drizzle(sqlite, { schema })
export type DbClient = typeof db
