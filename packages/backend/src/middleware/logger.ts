import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/hono'

export const logger = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  const id = c.get('requestId' as never) as string | undefined
  const rid = id ? ` ${id}` : ''
  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms${rid}`)
})
