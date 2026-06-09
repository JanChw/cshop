const API_BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
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
  }
}
