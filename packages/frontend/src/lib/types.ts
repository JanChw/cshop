export interface Product {
  id: number | string
  name: string
  basePrice: number
  originalPrice?: number | null
  category: string
  image: string
  images?: string[]
  description?: string
  sizes?: string[]
  colors?: string[]
  tags?: string[] | string
  designer?: string
  fabric?: string
  fit?: string
  customizable?: boolean
}

export interface CartItem {
  id: number | string
  productId: number
  variantId?: number | null
  designId?: number | null
  quantity: number
  product?: Product
  size?: string
  color?: string
  name?: string
  image?: string
  price?: number
}

export interface Order {
  id: number | string
  status: string
  total: number
  address?: string
  items: OrderItem[]
  createdAt: string
  updatedAt?: string
  paidAt?: string
  shippedAt?: string
  completedAt?: string
  cancelledAt?: string
  trackingNo?: string
}

export interface OrderItem {
  id: number | string
  productId: number
  variantId?: number | null
  designId?: number | null
  quantity: number
  price: number
  product?: Product
}

export interface User {
  id: number
  email: string
  name: string
  avatar?: string | null
  phone?: string | null
  bio?: string | null
  gender?: string | null
  birthday?: string | null
  createdAt: string
}

export interface Address {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}
