const API_BASE = '/api/v1'

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('cshop_token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const base = typeof window !== 'undefined' ? '' : 'http://localhost:3001'
  const res = await fetch(`${base}${API_BASE}${path}`, { headers, ...options })
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

export interface DesignItem {
  id: number
  userId: number
  productId: number
  variantId: number | null
  name: string
  canvasData: string
  previewImage: string | null
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
    list: (params?: { category?: string; search?: string }) =>
      request<{ success: boolean; data: any[] }>('/products', { method: 'GET' }),
    get: (id: string) =>
      request<{ success: boolean; data: any }>(`/products/${id}`)
  },
  cart: {
    list: () => request<{ success: boolean; data: any[] }>('/cart'),
    add: (productId: string, quantity: number, size: string, color: string) =>
      request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity, size, color }) }),
    addDesign: (productId: number, variantId: number, designId: number, quantity: number) =>
      request('/cart', { method: 'POST', body: JSON.stringify({ productId, variantId, designId, quantity }) }),
    update: (itemId: string, quantity: number) =>
      request(`/cart/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    remove: (itemId: string) =>
      request(`/cart/${itemId}`, { method: 'DELETE' })
  },
  orders: {
    list: (params?: { status?: string }) =>
      request<{ success: boolean; data: any[] }>('/orders'),
    get: (id: string) =>
      request<{ success: boolean; data: any }>(`/orders/${id}`),
    create: (data: any) =>
      request('/orders', { method: 'POST', body: JSON.stringify(data) })
  },
  auth: {
    login: (identifier: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
    register: (name: string, email: string, password: string) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })
  },
  user: {
    get: () => request<{ success: boolean; data: any }>('/user/me'),
    update: (data: any) =>
      request('/user/me', { method: 'PATCH', body: JSON.stringify(data) })
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
  }
}
