import { For } from 'solid-js'
import { BRUSH_COLORS, BRUSH_STYLES, type BrushStyle } from '../design-types'

interface Props {
  mode: 'brush' | 'move'
  color: string
  size: number
  style: BrushStyle
  onModeChange: (mode: 'brush' | 'move') => void
  onColorChange: (hex: string) => void
  onSizeChange: (px: number) => void
  onStyleChange: (style: BrushStyle) => void
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
  hasDrawing: boolean
}

export default function DrawingPanel(props: Props) {
  return (
    <section class="px-0 mt-6 space-y-6">
      <div class="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl border border-outline-variant">
        <button
          class={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            props.mode === 'brush'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
          }`}
          onClick={() => props.onModeChange('brush')}
        >
          <span class="material-symbols-outlined">brush</span>
          画笔
        </button>
        <button
          class={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            props.mode === 'move'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
          }`}
          onClick={() => props.onModeChange('move')}
        >
          <span class="material-symbols-outlined">pan_tool</span>
          移动
        </button>
      </div>

      <div class="space-y-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
        <div class="flex justify-between items-center">
          <h3 class="text-label-md font-medium text-on-surface-variant">
            手绘工具
          </h3>
          <span class="material-symbols-outlined text-primary text-xl">brush</span>
        </div>

        <div class="space-y-2">
          <span class="text-xs text-on-surface-variant">画笔颜色</span>
          <div class="flex gap-2">
            <For each={BRUSH_COLORS}>
              {(c) => {
                const isSelected = () => props.color === c
                return (
                  <button
                    class="w-9 h-9 rounded-full"
                    style={{
                      'background-color': c,
                      border: isSelected() ? '2px solid var(--color-on-surface)' : '2px solid transparent',
                      'box-shadow': isSelected() ? '0 0 0 2px var(--color-outline-variant)' : 'none'
                    }}
                    onClick={() => props.onColorChange(c)}
                    aria-label={`画笔颜色 ${c}`}
                  />
                )
              }}
            </For>
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-xs text-on-surface-variant">画笔样式</span>
          <div class="grid grid-cols-3 gap-2 p-1 bg-surface-container rounded-xl border border-outline-variant">
            <For each={BRUSH_STYLES}>
              {(s) => {
                const selected = () => props.style === s.key
                return (
                  <button
                    class={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      selected()
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                    }`}
                    onClick={() => props.onStyleChange(s.key)}
                    aria-label={s.label}
                  >
                    <span class="material-symbols-outlined text-sm">{s.icon}</span>
                    {s.label}
                  </button>
                )
              }}
            </For>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs text-on-surface-variant">画笔粗细</span>
            <span class="text-xs font-bold text-primary">{props.size}px</span>
          </div>
          <input
            class="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            type="range"
            min="1"
            max="24"
            value={props.size}
            onInput={(e) => props.onSizeChange(parseInt(e.currentTarget.value))}
          />
          <div class="flex items-center justify-center pt-2 pb-1">
            <div
              class="rounded-full"
              style={{
                width: `${Math.max(4, Math.min(40, props.size))}px`,
                height: `${Math.max(4, Math.min(40, props.size))}px`,
                'background-color': props.color
              }}
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          class="flex items-center justify-center gap-2 py-3 rounded-xl border border-outline-variant bg-surface hover:border-primary hover:bg-primary-container/10 transition-colors transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={props.onUndo}
          disabled={!props.canUndo}
        >
          <span class="material-symbols-outlined text-primary">undo</span>
          <span class="text-sm font-bold">撤销</span>
        </button>
        <button
          class="flex items-center justify-center gap-2 py-3 rounded-xl border border-outline-variant bg-surface hover:border-error hover:bg-error-container/30 hover:text-error transition-colors transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={props.onClear}
          disabled={!props.hasDrawing}
        >
          <span class="material-symbols-outlined">delete_sweep</span>
          <span class="text-sm font-bold">清空</span>
        </button>
      </div>

      <div class="bg-tertiary-container text-on-tertiary-container rounded-lg p-4 flex gap-3 items-start">
        <span class="material-symbols-outlined text-tertiary shrink-0">info</span>
        <p class="text-xs leading-relaxed">
          {props.mode === 'brush'
            ? '画笔模式下可直接在画布上涂鸦；切换到移动模式可拖拽素材或平移画布。'
            : '移动模式下可以拖拽文字、贴纸，或在空白处拖动平移画布。'}
        </p>
      </div>
    </section>
  )
}
