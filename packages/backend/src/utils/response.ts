import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function success(c: Context, data: unknown = null, status: ContentfulStatusCode = 200) {
  return c.json({ success: true, data, error: null }, status)
}

export function fail(c: Context, error: string, status: ContentfulStatusCode = 400) {
  return c.json({ success: false, data: null, error }, status)
}
