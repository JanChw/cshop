import type { Context } from 'hono'

export function errorHandler(err: Error, c: Context) {
  const id = (c.get('requestId' as never) as string | undefined) ?? '-'
  console.error(`[errorHandler] requestId=${id} ${c.req.method} ${c.req.path} ${c.res?.status ?? 500}`)
  console.error(err)
  return c.json({ success: false, data: null, error: '服务器内部错误' }, 500)
}
