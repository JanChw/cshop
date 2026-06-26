const API_BASE = '/api/v1'

function storageGet(key: string): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(key) || localStorage.getItem(key)
}

function getToken(): string | null {
  return storageGet('cshop_token')
}

function getRefreshToken(): string | null {
  return storageGet('cshop_refresh')
}

function tokenStore(): 'session' | 'local' {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cshop_token')) return 'session'
  return 'local'
}

function setTokens(accessToken: string, refreshToken: string): void {
  const store = tokenStore()
  const s = store === 'session' ? sessionStorage : localStorage
  s.setItem('cshop_token', accessToken)
  s.setItem('cshop_refresh', refreshToken)
}

export function clearAuth(): void {
  const keys = ['cshop_token', 'cshop_refresh', 'cshop_user']
  for (const k of keys) {
    localStorage.removeItem(k)
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(k)
  }
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken()
  if (!rt) return null
  if (refreshPromise) return refreshPromise
  const base = typeof window !== 'undefined' ? '' : 'http://localhost:3001'
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${base}${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      })
      if (!res.ok) { clearAuth(); return null }
      const json = await res.json()
      if (!json.success) { clearAuth(); return null }
      setTokens(json.data.accessToken, json.data.refreshToken)
      return json.data.accessToken
    } catch {
      clearAuth()
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const base = typeof window !== 'undefined' ? '' : 'http://localhost:3001'
  const res = await fetch(`${base}${API_BASE}${path}`, { headers, ...options })

  // 401 → attempt token refresh once, then retry the original request
  if (res.status === 401 && token && !path.startsWith('/auth/')) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      const retryHeaders: Record<string, string> = { ...headers, Authorization: `Bearer ${newToken}` }
      const retry = await fetch(`${base}${API_BASE}${path}`, { ...options, headers: retryHeaders })
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({}))
        throw new Error(body.error || `API error: ${retry.status}`)
      }
      return retry.json()
    }
    redirectToLogin()
    throw new Error('登录已过期，请重新登录')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

export interface DesignDraftItem {
  id: number
  userId: number
  productId: number
  variantId: number | null
  name: string | null
  canvasData: string
  previewImage: string | null
  createdAt: string
  updatedAt: string
}

export interface DesignItem {
  id: number
  userId: number
  productId: number
  variantId: number | null
  name: string
  canvasData: string
  previewImage: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface UploadItem {
  id: number
  originalName: string
  baseName: string
  width: number
  height: number
  thumbUrl: string
  smallUrl?: string
  mediumUrl?: string
  createdAt: string
}

export interface StickerItem {
  id: number
  userId: number | null
  name: string
  category: string
  imagePath: string
  width: number
  height: number
  url: string
  createdAt: string
}

export interface UserStickerItem {
  id: number
  userId: number
  name: string
  category: string
  imagePath: string
  width: number
  height: number
  url: string
  createdAt: string
}

export interface HomeSection {
  id: number
  type: 'hero' | 'videos' | 'product_row' | 'card_grid' | 'designer_grid'
  title: string | null
  subTitle: string | null
  data: any
  sort: number
  isActive: boolean
}

export const api = {
  homeSections: {
    list: () => request<{ success: boolean; data: { items: HomeSection[] } }>('/home-sections'),
    get: (id: number) => request<{ success: boolean; data: HomeSection }>(`/home-sections/${id}`)
  },
  products: {
    list: (params?: { categoryId?: number; q?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.categoryId !== undefined) qs.set('categoryId', String(params.categoryId))
      if (params?.q) qs.set('q', params.q)
      if (params?.page !== undefined) qs.set('page', String(params.page))
      if (params?.limit !== undefined) qs.set('limit', String(params.limit))
      const s = qs.toString()
      return request<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }>(`/products${s ? '?' + s : ''}`)
    },
    get: (id: string) =>
      request<{ success: boolean; data: any }>(`/products/${id}`),
    baseDesign: (id: string) =>
      request<{ success: boolean; data: { originalImage: string | null; frontImage: string | null; maskImage: string | null } }>(`/products/${id}/base-design`)
  },
  cart: {
    list: () => request<{ success: boolean; data: any[] }>('/cart'),
    add: (productId: number, quantity: number, size: string, color: string) =>
      request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity, size, color }) }),
    addDesign: (productId: number, variantId: number, designId: number, quantity: number) =>
      request('/cart', { method: 'POST', body: JSON.stringify({ productId, variantId, designId, quantity }) }),
    update: (itemId: string, quantity: number) =>
      request(`/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    remove: (itemId: string) =>
      request(`/cart/${itemId}`, { method: 'DELETE' })
  },
  orders: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.page !== undefined) qs.set('page', String(params.page))
      if (params?.limit !== undefined) qs.set('limit', String(params.limit))
      const s = qs.toString()
      return request<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }>(`/orders${s ? '?' + s : ''}`)
    },
    get: (id: string) =>
      request<{ success: boolean; data: any }>(`/orders/${id}`),
    create: (data: any) =>
      request('/orders', { method: 'POST', body: JSON.stringify(data) })
  },
  auth: {
    login: (email: string, password: string, rememberMe?: boolean) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) }),
    register: (name: string, email: string, password: string) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    logout: (refreshToken: string) =>
      request<{ success: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    logoutAll: () =>
      request<{ success: boolean }>('/auth/logout-all', { method: 'POST' }),
    refresh: (refreshToken: string) =>
      request<{ success: boolean; data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<{ success: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
    sendPhoneCode: (phone: string) =>
      request<{ success: boolean; data: { message: string } }>('/auth/phone/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),
    bindPhone: (phone: string, code: string) =>
      request<{ success: boolean; data: { phone: string } }>('/auth/phone/bind', { method: 'POST', body: JSON.stringify({ phone, code }) }),
    sessions: () =>
      request<{ success: boolean; data: any[] }>('/auth/sessions')
  },
  user: {
    get: () => request<{ success: boolean; data: any }>('/auth/me'),
    update: (data: any) =>
      request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) })
  },
  addresses: {
    list: () => request<{ success: boolean; data: any[] }>('/user/addresses'),
    get: (id: number) => request<{ success: boolean; data: any }>(`/user/addresses/${id}`),
    create: (data: any) =>
      request('/user/addresses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/user/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) =>
      request(`/user/addresses/${id}`, { method: 'DELETE' }),
    setDefault: (id: number) =>
      request(`/user/addresses/default/${id}`, { method: 'POST' })
  },
  designDrafts: {
    list: (productId?: number) => {
      const qs = productId ? `?productId=${productId}` : ''
      return request<{ success: boolean; data: { items: DesignDraftItem[] } }>(`/design-drafts${qs}`)
    },
    get: (id: number) =>
      request<{ success: boolean; data: DesignDraftItem }>(`/design-drafts/${id}`),
    create: (data: { productId: number; variantId?: number | null; name?: string; canvasData: string; previewImage?: string | null }) =>
      request<{ success: boolean; data: DesignDraftItem }>('/design-drafts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { productId?: number; variantId?: number | null; name?: string; canvasData?: string; previewImage?: string | null }) =>
      request<{ success: boolean; data: { previewImage: string | null } | null }>(`/design-drafts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) =>
      request(`/design-drafts/${id}`, { method: 'DELETE' })
  },
  designs: {
    list: () =>
      request<{ success: boolean; data: { items: DesignItem[] } }>('/designs'),
    get: (id: number) =>
      request<{ success: boolean; data: DesignItem }>(`/designs/${id}`),
    create: (data: { productId: number; variantId?: number | null; name: string; canvasData: string; previewImage?: string | null }) =>
      request<{ success: boolean; data: DesignItem }>('/designs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { productId: number; variantId?: number | null; name: string; canvasData: string; previewImage?: string | null }) =>
      request<{ success: boolean; data: { previewImage: string | null } | null }>(`/designs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    togglePublic: (id: number) =>
      request<{ success: boolean; data: { isPublic: boolean } }>(`/designs/${id}/public`, { method: 'PATCH' }),
    listPublic: () =>
      request<{ success: boolean; data: { items: DesignItem[] } }>('/designs'),
    remove: (id: number) =>
      request(`/designs/${id}`, { method: 'DELETE' })
  },
  stickers: {
    list: (params?: { category?: string; q?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.category) qs.set('category', params.category)
      if (params?.q) qs.set('q', params.q)
      if (params?.page) qs.set('page', String(params.page))
      if (params?.limit) qs.set('limit', String(params.limit))
      const s = qs.toString()
      return request<{ success: boolean; data: { items: StickerItem[]; total: number; page: number; limit: number; totalPages: number } }>(`/stickers${s ? '?' + s : ''}`)
    }
  },
  userStickers: {
    list: (params?: { category?: string }) => {
      const qs = params?.category ? `?category=${encodeURIComponent(params.category)}` : ''
      return request<{ success: boolean; data: { items: UserStickerItem[] } }>(`/user/stickers${qs}`)
    },
    create: (file: File, name: string, category?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      if (category) formData.append('category', category)
      return requestFormData<{ success: boolean; data: UserStickerItem }>('/user/stickers', formData)
    },
    update: (id: number, data: { name?: string; category?: string }) =>
      request<{ success: boolean; data: null }>(`/user/stickers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) =>
      request<{ success: boolean; data: null }>(`/user/stickers/${id}`, { method: 'DELETE' })
  },
  categories: {
    list: () =>
      request<{ success: boolean; data: { items: any[] } }>('/categories')
  },
  uploads: {
    list: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      const qs = q.toString()
      return request<{ success: boolean; data: { items: UploadItem[]; total: number; page: number; limit: number } }>(`/uploads${qs ? `?${qs}` : ''}`)
    },
    create: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return requestFormData<{ success: boolean; data: { baseName: string; variants: any } }>('/uploads', formData)
    },
    remove: (id: number) =>
      request(`/uploads/${id}`, { method: 'DELETE' })
  },
  favorites: {
    list: () =>
      request<{ success: boolean; data: { items: any[]; total: number } }>('/user/favorites'),
    add: (productId: number) =>
      request<{ success: boolean; data: any }>('/user/favorites', { method: 'POST', body: JSON.stringify({ productId }) }),
    remove: (productId: number) =>
      request<{ success: boolean; data: null }>(`/user/favorites/${productId}`, { method: 'DELETE' }),
    check: (productId: number) =>
      request<{ success: boolean; data: { favorited: boolean } }>(`/user/favorites/${productId}/check`)
  }
}

export async function performLogout(): Promise<void> {
  const rt = getRefreshToken()
  if (rt) {
    try { await api.auth.logout(rt) } catch { /* ignore network errors */ }
  }
  clearAuth()
  if (typeof window !== 'undefined') window.location.href = '/login'
}
