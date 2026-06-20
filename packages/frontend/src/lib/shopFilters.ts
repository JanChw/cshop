export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  description?: string
  tags?: string[]
  fabric: string
  fit: string
  sizes: string[]
}

export const FABRIC_OPTS = [
  { value: '', label: '全部面料' },
  { value: '棉质', label: '棉质' },
  { value: '涤纶', label: '涤纶' },
  { value: '混纺', label: '混纺' },
]

export const FIT_OPTS = [
  { value: '', label: '全部版型' },
  { value: '宽松', label: '宽松' },
  { value: '修身', label: '修身' },
  { value: '常规', label: '常规' },
]

export const SIZE_OPTS = [
  { value: '', label: '全部尺码' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
]

export const PRICE_OPTS = [
  { value: '', label: '全部价格' },
  { value: '0-100', label: '¥0-100' },
  { value: '100-200', label: '¥100-200' },
  { value: '200+', label: '¥200+' },
]

export const SORT_OPTS = [
  { value: 'default', label: '综合排序' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'newest', label: '最新上架' },
] as const

export type SortMode = (typeof SORT_OPTS)[number]['value']

export function matchPrice(price: number, range: string): boolean {
  if (!range) return true
  if (range === '0-100') return price <= 100
  if (range === '100-200') return price > 100 && price <= 200
  if (range === '200+') return price > 200
  return true
}
