import { createApp } from './app'
import { scheduleAutoBackup } from './scheduler'
import { config } from './config'
import { initGeo } from './utils/geo'
import { startFlushTimer } from './utils/eventQueue'

const app = createApp()

if (import.meta.main) {
  scheduleAutoBackup()
  initGeo().catch(() => {})
  startFlushTimer()
}

export default { port: config.port, hostname: config.hostname, fetch: app.fetch }
