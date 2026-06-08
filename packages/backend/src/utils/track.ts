import { enqueueEvent, enqueueOnlineUpsert } from './eventQueue'
import { detectDevice } from './deviceDetect'
import { lookupGeo } from './geo'
import type { DeviceType } from './deviceDetect'

export function trackBusinessEvent(opts: {
  c: { req: { header: (n: string) => string | undefined }; get: (k: string) => unknown }
  userId: number | null
  eventType: string
  metadata?: Record<string, unknown>
}): void {
  const ua = opts.c.req.header('User-Agent')
  const ip = opts.c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? opts.c.req.header('X-Real-IP')
    ?? 'unknown'
  const deviceType: DeviceType = detectDevice(ua)
  const geo = lookupGeo(ip)

  enqueueEvent({
    userId: opts.userId,
    eventType: opts.eventType,
    path: '',
    deviceType,
    ip,
    userAgent: ua,
    geo,
    metadata: opts.metadata
  })
}

export function trackLogin(opts: {
  c: { req: { header: (n: string) => string | undefined } }
  userId: number
}): void {
  const ua = opts.c.req.header('User-Agent')
  const ip = opts.c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? opts.c.req.header('X-Real-IP')
    ?? 'unknown'
  const deviceType: DeviceType = detectDevice(ua)
  const geo = lookupGeo(ip)

  enqueueEvent({
    userId: opts.userId,
    eventType: 'login',
    path: '/api/v1/auth/login',
    method: 'POST',
    statusCode: 200,
    deviceType,
    ip,
    userAgent: ua,
    geo
  })

  enqueueOnlineUpsert({
    userId: opts.userId,
    deviceType,
    ip,
    userAgent: ua,
    geo,
    isLogin: true
  })
}

export function trackLogout(opts: {
  userId: number
}): void {
  enqueueEvent({
    userId: opts.userId,
    eventType: 'logout',
    path: '/api/v1/auth/logout',
    method: 'POST',
    statusCode: 200,
    deviceType: 'desktop'
  })
}
