export interface DesignTextDraft {
  text: string
  font: string
  color: string
  size: number
  letterSpacing: number
  bold: boolean
  italic: boolean
}

export type DesignTab = 'color' | 'text' | 'assets' | 'drawing'

export const DESIGN_TABS: { key: DesignTab; label: string }[] = [
  { key: 'color', label: '基础颜色' },
  { key: 'text', label: '文字引擎' },
  { key: 'assets', label: '素材' },
  { key: 'drawing', label: '手绘' }
]

export const TSHIRT_COLORS: { name: string; hex: string }[] = [
  { name: '珍珠白', hex: '#ffffff' },
  { name: '极简黑', hex: '#1a1a1a' },
  { name: '麻灰色', hex: '#b5b5b5' },
  { name: '撒哈拉金', hex: '#c2652a' },
  { name: '森林绿', hex: '#2d4a3e' },
  { name: '酒红色', hex: '#8c3c3c' }
]

export const TEXT_PALETTE = ['#c2652a', '#3a302a', '#8c3c3c', '#ffffff', '#f0a878']

export const FONT_OPTIONS: { name: string; sub: string; family: string; cls?: string; bold?: boolean; italic?: boolean }[] = [
  { name: 'Manrope', sub: 'Modern Sans', family: 'Manrope' },
  { name: 'EB Garamond', sub: 'Classic Serif', family: 'EB Garamond' },
  { name: 'Playfair', sub: 'Elegant Editorial', family: 'Playfair Display' },
  { name: 'Space Mono', sub: 'Technical Look', family: 'Space Mono' }
]

export const BRUSH_COLORS = ['#0052FF', '#151c27', '#F87171', '#34D399', '#c2652a']

export type BrushStyle = 'pencil' | 'marker' | 'spray'

export const BRUSH_STYLES: { key: BrushStyle; label: string; icon: string }[] = [
  { key: 'pencil', label: '铅笔', icon: 'edit' },
  { key: 'marker', label: '马克笔', icon: 'circle' },
  { key: 'spray', label: '喷雾', icon: 'water_drop' }
]
