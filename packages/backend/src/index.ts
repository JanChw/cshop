import { createApp } from './app'
import { scheduleAutoBackup } from './scheduler'
import { config } from './config'
import { initGeo } from './utils/geo'
import { flush, startFlushTimer } from './utils/eventQueue'
import { startRollupTimer } from './utils/analyticsRollup'

const app = createApp()

if (import.meta.main) {
  scheduleAutoBackup()
  initGeo().catch(() => {})
  startFlushTimer()
  startRollupTimer()

  // Graceful shutdown: drain the in-memory event queue so we don't drop
  // analytics events on a clean stop. Hard kill (-9) still loses them, which
  // is acceptable for in-process buffering.
  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[shutdown] ${signal} received, flushing event queue…`)
    try {
      await flush()
    } catch (err) {
      console.error('[shutdown] flush failed:', err)
    }
    process.exit(0)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default { port: config.port, hostname: config.hostname, fetch: app.fetch }
