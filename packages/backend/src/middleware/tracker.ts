import { createMiddleware } from 'hono/factory'
import { detectDevice } from '../utils/deviceDetect'
import { lookupGeo } from '../utils/geo'
import { enqueueEvent, enqueueOnlineUpsert, lazyClean } from '../utils/eventQueue'
import type { AppEnv } from '../types/hono'

export const tracker = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start

  const userId = c.get('userId' as never) as number | undefined
  if (!userId) return

  const ua = c.req.header('User-Agent')
  const ip = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? c.req.header('X-Real-IP')
    ?? 'unknown'
  const deviceType = detectDevice(ua)
  const geo = lookupGeo(ip)

  enqueueEvent({
    userId,
    eventType: 'api_call',
    path: c.req.path,
    method: c.req.method,
    statusCode: c.res.status,
    duration,
    ip,
    userAgent: ua,
    deviceType,
    geo
  })

  enqueueOnlineUpsert({
    userId,
    deviceType,
    ip,
    userAgent: ua,
    geo
  })

  lazyClean().catch(() => {})
})
