import { createApp } from '../../src/app'

const app = createApp()

interface ReqOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS'
  body?: unknown
  token?: string
  headers?: Record<string, string>
}

// Lightweight wrapper around app.fetch that handles JSON and auth.
// Returns parsed body (assuming JSON) plus status for assertions.
export async function api(path: string, opts: ReqOpts = {}): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) }
  let body: BodyInit | undefined

  if (opts.body !== undefined) {
    if (opts.body instanceof FormData) {
      body = opts.body
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(opts.body)
    }
  }
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`
  }

  const res = await app.fetch(new Request(`http://test${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body
  }))

  const text = await res.text()
  let parsed: any = null
  if (text) {
    try { parsed = JSON.parse(text) } catch { parsed = text }
  }
  return { status: res.status, body: parsed }
}
