// Centralized runtime configuration.
//
// All values are read from `process.env` LAZILY through getters. This is
// important so test setup (bun preload + bunfig.toml) can mutate
// process.env before any consumer reads it; capturing at module load
// would race with ESM static-import hoisting.

import { resolve } from 'node:path'

function dataDir(): string {
  return process.env.DATA_DIR ?? resolve(process.cwd(), 'data')
}

export const config = {
  get port(): number { return Number(process.env.PORT ?? 3001) },
  get hostname(): string { return process.env.HOSTNAME ?? '0.0.0.0' },
  get nodeEnv(): string { return process.env.NODE_ENV ?? 'development' },

  get dbPath(): string { return process.env.DB_PATH ?? resolve(dataDir(), 'cshop.db') },

  get uploadDir(): string { return process.env.UPLOAD_DIR ?? resolve(dataDir(), 'uploads') },
  get stickerDir(): string { return process.env.STICKER_DIR ?? resolve(dataDir(), 'stickers') },
  get backupDir(): string { return process.env.BACKUP_DIR ?? resolve(dataDir(), 'backups') },

  get corsOrigins(): string[] { return process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) ?? ['*'] },

  get jwtSecret(): string | undefined { return process.env.JWT_SECRET },

  get uploadMaxBytes(): number { return Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024) },
  get stickerMaxBytes(): number { return Number(process.env.STICKER_MAX_BYTES ?? 2 * 1024 * 1024) },

  get geoDbPath(): string { return process.env.GEO_DB_PATH ?? resolve(dataDir(), 'geo', 'dbip-city-lite.mmdb') },

  get smtpHost(): string | undefined { return process.env.SEND_EMAIL },
  get smtpPort(): number { return Number(process.env.SEND_PORT ?? 465) },
  get smtpUser(): string | undefined { return process.env.EMAIL },
  get smtpPass(): string | undefined { return process.env.EMAIL_AUTH_PASSWORD }
}

export function isProd(): boolean {
  return config.nodeEnv === 'production'
}
