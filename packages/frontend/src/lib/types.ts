export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  image: string
  description?: string
  sizes?: string[]
  colors?: string[]
  tags?: string[]
  designer?: string
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  size: string
  color: string
  designId?: string
}

export interface Order {
  id: string
  orderNumber: string
  items: { product: Product; quantity: number; size: string; color: string }[]
  status: 'pending' | 'shipping' | 'completed' | 'cancelled'
  total: number
  createdAt: string
  designer?: string
  trackingNumber?: string
  carrier?: string
}

export interface User {
  id: string
  name: string
  avatar: string
  level: number
  title: string
  stats: {
    designs: number
    orders: number
    likes: number
    points: number
  }
}

export interface DesignDraft {
  id: string
  name: string
  image: string
  status: 'draft' | 'ordered'
}
