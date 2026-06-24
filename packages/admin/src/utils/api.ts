const BASE_URL = '/api/v1'

export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error: string | null
}

function getToken(): string | null {
  return localStorage.getItem('cshop_admin_token')
}

function setToken(token: string) {
  localStorage.setItem('cshop_admin_token', token)
}

function getRefreshToken(): string | null {
  return localStorage.getItem('cshop_admin_refresh')
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken()
  if (!rt) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    })
    const text = await res.text()
    const json: ApiResponse<{ accessToken: string; refreshToken: string }> = text ? JSON.parse(text) : { success: false, data: null, error: '服务器返回空响应' }
    if (json.success && json.data?.accessToken) {
      setToken(json.data.accessToken)
      if (json.data.refreshToken) {
        localStorage.setItem('cshop_admin_refresh', json.data.refreshToken)
      }
      return true
    }
    return false
  } catch {
    return false
  }
}

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; params?: Record<string, unknown>; formData?: FormData }
): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }

  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let body: string | FormData | undefined
  if (options?.formData) {
    body = options.formData
  } else if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  try {
    let res = await fetch(url.toString(), { method, headers, body })
    if (res.status === 401 && !path.startsWith('/auth/')) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getToken()}`
        res = await fetch(url.toString(), { method, headers, body })
      } else {
        localStorage.clear()
        window.location.hash = '#/login'
        return { success: false, data: null, error: '登录已过期，请重新登录' }
      }
    }
    const text = await res.text()
    const json: ApiResponse<T> = text ? JSON.parse(text) : { success: false, data: null, error: '服务器返回空响应' }
    return json
  } catch (err: any) {
    return { success: false, data: null, error: err.message || '网络错误' }
  }
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string, params?: Record<string, unknown>) => request<T>('DELETE', path, { params }),
  upload: <T>(path: string, formData: FormData) => request<T>('POST', path, { formData }),
}
