export interface DesignTextDraft {
  text: string
  font: string
  color: string
  size: number
  letterSpacing: number
  bold: boolean
  italic: boolean
}

export type DesignTool = 'product' | 'color' | 'text' | 'assets' | 'drawing'

export const DESIGN_TOOLS: { key: DesignTool; label: string; icon: string }[] = [
  { key: 'product', label: '服装', icon: 'checkroom' },
  { key: 'color', label: '颜色', icon: 'palette' },
  { key: 'text', label: '文字', icon: 'text_fields' },
  { key: 'assets', label: '素材', icon: 'auto_awesome' },
  { key: 'drawing', label: '手绘', icon: 'draw' }
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
  { name: 'Space Mono', sub: 'Technical Look', family: 'Space Mono' },
  { name: 'System Sans', sub: 'Native UI', family: 'system-ui, sans-serif' },
  { name: 'System Mono', sub: 'Native Mono', family: 'ui-monospace, monospace' }
]

export const DEFAULT_CANVAS_INK = '#000000'
export const DEFAULT_DRAWING_COLOR = '#0052FF'

export const BRUSH_COLORS = ['#0052FF', '#151c27', '#F87171', '#34D399', '#c2652a']

export type BrushStyle = 'pencil' | 'marker' | 'spray'

export const BRUSH_STYLES: { key: BrushStyle; label: string; icon: string }[] = [
  { key: 'pencil', label: '铅笔', icon: 'edit' },
  { key: 'marker', label: '马克笔', icon: 'circle' },
  { key: 'spray', label: '喷雾', icon: 'water_drop' }
]
