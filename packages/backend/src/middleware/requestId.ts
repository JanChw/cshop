import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'node:crypto'
import type { AppEnv } from '../types/hono'

// Stamp every request with a stable id (honor an inbound X-Request-ID so
// upstream gateways can correlate). The id is exposed on the response so
// clients can quote it in support tickets, and via c.get('requestId') so
// logger / errorHandler can attach it to log lines.
export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const inbound = c.req.header('X-Request-ID')
  const id = inbound && inbound.length <= 128 ? inbound : randomUUID()
  c.set('requestId', id)
  await next()
  c.header('X-Request-ID', id)
})
