import { createMiddleware } from 'hono/factory'
import { detectDevice } from '../utils/deviceDetect'
import { lookupGeo } from '../utils/geo'
import { getClientIP } from '../utils/request'
import { enqueueEvent, enqueueOnlineUpsert, lazyClean } from '../utils/eventQueue'
import type { AppEnv } from '../types/hono'

// Skip event tracking for high-frequency, low-value endpoints so the
// activity_events table doesn't grow with PV. Health probes and static
// file serving (sticker/upload/preview images) would otherwise dominate.
const SKIP_PREFIXES = [
  '/api/v1/health',
  '/api/v1/readyz'
]
const SKIP_GET_PATTERNS = [
  /^\/api\/v1\/stickers\/[^/]+$/,          // sticker image file
  /^\/api\/v1\/uploads\/[^/]+$/,           // uploaded image file
  /^\/api\/v1\/designs\/\d+\/preview$/,    // design preview image
  /^\/api\/v1\/design-drafts\/\d+\/preview$/ // draft preview image
]

function shouldSkipTracking(path: string, method: string): boolean {
  if (method === 'GET' && SKIP_PREFIXES.some(p => path === p)) return true
  if (method === 'GET' && SKIP_GET_PATTERNS.some(re => re.test(path))) return true
  return false
}

export const tracker = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start

  if (shouldSkipTracking(c.req.path, c.req.method)) return

  const userId = c.get('userId' as never) as number | undefined
  // Authenticated users: record every call (volume is bounded by user count).
  // Anonymous users: sample 10% so public-endpoint abuse and crawler volume
  // stay visible in analytics without drowning the activity_events table.
  if (!userId && Math.random() > 0.1) return

  const ua = c.req.header('User-Agent')
  const ip = getClientIP(c)
  const deviceType = detectDevice(ua)
  const geo = lookupGeo(ip)

  enqueueEvent({
    userId: userId ?? null,
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

  // Online tracking only makes sense for identified users.
  if (userId) {
    enqueueOnlineUpsert({
      userId,
      deviceType,
      ip,
      userAgent: ua,
      geo
    })
  }

  lazyClean().catch(() => {})
})
