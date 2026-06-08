import type { Context } from 'hono'

export function errorHandler(err: Error, c: Context) {
  console.error(err)
  return c.json({ success: false, data: null, error: '服务器内部错误' }, 500)
}
