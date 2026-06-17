import { createSignal, createMemo, onMount, onCleanup, Show, For } from 'solid-js'
import FabricCanvas, { type CanvasAPI, type DesignText } from '../../ui/FabricCanvas'
import { FONT_OPTIONS, TEXT_PALETTE } from './design-types'

interface Props {
  tshirtImage: string
  tshirtColor: string
  bgColor: string
  drawing: { enabled: boolean; mode?: 'brush' | 'move'; color: string; size: number; style?: 'pencil' | 'marker' | 'spray' }
  interactive?: boolean
  onReady?: (api: CanvasAPI) => void
  onChange?: () => void
}

export default function DesignCanvas(props: Props) {
  const [previewScale, setPreviewScale] = createSignal(1)
  const [previewX, setPreviewX] = createSignal(0)
  const [previewY, setPreviewY] = createSignal(0)
  const [isDragging, setIsDragging] = createSignal(false)
  const [hasSelection, setHasSelection] = createSignal(false)
  const [selectedText, setSelectedText] = createSignal<DesignText | null>(null)

  let panStartX = 0, panStartY = 0, startX = 0, startY = 0
  let initialPinchDistance = 0
  let initialPinchScale = 1
  let canvasAPI: CanvasAPI | null = null
  const [canvasReady, setCanvasReady] = createSignal(false)

  const inBrushMode = () => props.drawing.enabled && props.drawing.mode === 'brush'

  const onPanStart = (clientX: number, clientY: number) => {
    if (inBrushMode()) return
    if (canvasAPI?.hasActiveObject()) return
    setIsDragging(true)
    panStartX = clientX
    panStartY = clientY
    startX = previewX()
    startY = previewY()
  }

  const onPanMove = (clientX: number, clientY: number) => {
    if (!isDragging()) return
    setPreviewX(startX + (clientX - panStartX) / previewScale())
    setPreviewY(startY + (clientY - panStartY) / previewScale())
  }

  const onPanEnd = () => setIsDragging(false)

  const getPinchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const onPinchStart = (touches: TouchList) => {
    if (touches.length < 2) return
    initialPinchDistance = getPinchDistance(touches)
    initialPinchScale = previewScale()
  }

  const onPinchMove = (touches: TouchList) => {
    if (touches.length < 2 || initialPinchDistance === 0) return
    const scaleRatio = getPinchDistance(touches) / initialPinchDistance
    setPreviewScale(Math.max(initialPinchScale * scaleRatio, 1))
  }

  const onPinchEnd = () => { initialPinchDistance = 0 }

  const imageTransform = createMemo(() =>
    `scale(${previewScale()}) translate(${previewX()}px, ${previewY()}px)`
  )

  const zoomIn = () => setPreviewScale(s => s + 0.2)
  const zoomOut = () => setPreviewScale(s => Math.max(s - 0.2, 1))
  const resetPreview = () => { setPreviewScale(1); setPreviewX(0); setPreviewY(0) }

  const handleReady = (api: CanvasAPI) => {
    canvasAPI = api
    setCanvasReady(true)
    props.onReady?.(api)
  }

  return (
    <section
      class="relative aspect-[4/5] w-full rounded-xl overflow-hidden mt-4"
      style={{
        'background-color': props.bgColor,
        cursor: inBrushMode() ? 'crosshair' : (isDragging() ? 'grabbing' : 'grab'),
        'touch-action': 'none'
      }}
      onMouseDown={(e) => onPanStart(e.clientX, e.clientY)}
      onMouseMove={(e) => onPanMove(e.clientX, e.clientY)}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
      onTouchStart={(e) => {
        if (e.touches.length === 1) onPanStart(e.touches[0].clientX, e.touches[0].clientY)
        else if (e.touches.length === 2) onPinchStart(e.touches)
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1 && isDragging()) onPanMove(e.touches[0].clientX, e.touches[0].clientY)
        else if (e.touches.length === 2) onPinchMove(e.touches)
      }}
      onTouchEnd={(e) => {
        if (e.touches.length < 2) onPinchEnd()
        if (e.touches.length === 0) onPanEnd()
      }}
    >
      <div
        class="absolute inset-0 flex items-center justify-center"
        style={{ transform: imageTransform(), transition: isDragging() ? 'none' : 'transform 0.1s ease-out' }}
      >
        <FabricCanvas
          tshirtImage={props.tshirtImage}
          tshirtColor={props.tshirtColor}
          drawing={props.drawing}
          interactive={canvasReady() && !(props.drawing.enabled && props.drawing.mode === 'brush')}
          onReady={handleReady}
          onChange={props.onChange}
          onSelectionChange={(hasSelection) => {
            setHasSelection(hasSelection)
            setSelectedText(hasSelection ? (canvasAPI?.getSelectedText() || null) : null)
          }}
        />
      </div>

      <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <Show when={!props.drawing.enabled}>
          <div class="bg-primary/90 text-on-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-auto">
            实时预览
          </div>
        </Show>
        <Show when={props.drawing.enabled}>
          <div class="bg-tertiary/90 text-on-tertiary px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-auto">
            {props.drawing.mode === 'brush' ? '画笔模式' : '移动模式'}
          </div>
        </Show>
        <div class="flex items-center gap-1 pointer-events-auto">
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white transition-all"
            onClick={zoomIn}
            aria-label="放大"
          >
            <span class="material-symbols-outlined text-lg">zoom_in</span>
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={zoomOut}
            disabled={previewScale() <= 1}
            aria-label="缩小"
          >
            <span class="material-symbols-outlined text-lg">zoom_out</span>
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white transition-all"
            onClick={resetPreview}
            aria-label="重置视图"
          >
            <span class="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      <Show when={selectedText()}>
        {(text) => (
          <div class="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface/95 backdrop-blur px-3 py-2 rounded-full shadow-lg border border-outline-variant/30 z-10 max-w-[92vw] overflow-x-auto" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
            <label
              class="relative w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer ring-1 ring-outline-variant"
              style={{ 'background-color': text().color }}
              aria-label="文字颜色"
            >
              <input
                type="color"
                class="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 opacity-0 cursor-pointer"
                value={text().color}
                onInput={(e) => {
                  canvasAPI?.setTextColor(e.currentTarget.value)
                  setSelectedText(canvasAPI?.getSelectedText() || null)
                }}
              />
            </label>

            <select
              class="h-8 px-2 rounded-lg bg-surface-container-high text-xs font-medium border border-outline-variant outline-none"
              value={text().font}
              onChange={(e) => {
                canvasAPI?.setTextFont(e.currentTarget.value)
                setSelectedText(canvasAPI?.getSelectedText() || null)
              }}
            >
              <For each={FONT_OPTIONS}>
                {(f) => <option value={f.family}>{f.name}</option>}
              </For>
            </select>

            <div class="flex items-center bg-surface-container-high rounded-lg border border-outline-variant overflow-hidden">
              <button
                class="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                onClick={() => {
                  canvasAPI?.setTextSize(-2)
                  setSelectedText(canvasAPI?.getSelectedText() || null)
                }}
                aria-label="减小字号"
              >
                <span class="material-symbols-outlined text-sm">remove</span>
              </button>
              <span class="text-xs font-bold px-1 min-w-[2ch] text-center">{Math.round(text().size)}</span>
              <button
                class="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                onClick={() => {
                  canvasAPI?.setTextSize(2)
                  setSelectedText(canvasAPI?.getSelectedText() || null)
                }}
                aria-label="增大字号"
              >
                <span class="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            <button
              class={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                text().bold
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-high text-secondary border-outline-variant hover:bg-surface-container'
              }`}
              onClick={() => {
                canvasAPI?.setTextBold(!text().bold)
                setSelectedText(canvasAPI?.getSelectedText() || null)
              }}
              aria-label="粗体"
            >
              <span class="material-symbols-outlined text-sm">format_bold</span>
            </button>

            <button
              class={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                text().italic
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-high text-secondary border-outline-variant hover:bg-surface-container'
              }`}
              onClick={() => {
                canvasAPI?.setTextItalic(!text().italic)
                setSelectedText(canvasAPI?.getSelectedText() || null)
              }}
              aria-label="斜体"
            >
              <span class="material-symbols-outlined text-sm">format_italic</span>
            </button>

            <div class="flex items-center bg-surface-container-high rounded-lg border border-outline-variant overflow-hidden">
              <button
                class="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                onClick={() => {
                  canvasAPI?.setTextLetterSpacing(-0.02)
                  setSelectedText(canvasAPI?.getSelectedText() || null)
                }}
                aria-label="减小字距"
              >
                <span class="material-symbols-outlined text-sm">compress</span>
              </button>
              <button
                class="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                onClick={() => {
                  canvasAPI?.setTextLetterSpacing(0.02)
                  setSelectedText(canvasAPI?.getSelectedText() || null)
                }}
                aria-label="增大字距"
              >
                <span class="material-symbols-outlined text-sm">expand</span>
              </button>
            </div>

            <div class="w-px h-6 bg-outline-variant mx-1" />

            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg text-error hover:bg-error/10 transition-colors"
              onClick={() => canvasAPI?.removeSelected()}
              aria-label="删除文字"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        )}
      </Show>

      <Show when={hasSelection() && !selectedText()}>
        <div class="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface/95 backdrop-blur px-3 py-2 rounded-full shadow-lg border border-outline-variant/30 z-10">
          <button
            class="flex items-center gap-1 text-sm font-bold text-on-surface px-2 py-1 rounded-lg hover:bg-surface-container transition-colors"
            onClick={() => canvasAPI?.bringToFront()}
            aria-label="置顶"
          >
            <span class="material-symbols-outlined">vertical_align_top</span>
            置顶
          </button>
          <button
            class="flex items-center gap-1 text-sm font-bold text-on-surface px-2 py-1 rounded-lg hover:bg-surface-container transition-colors"
            onClick={() => canvasAPI?.sendToBack()}
            aria-label="置底"
          >
            <span class="material-symbols-outlined">vertical_align_bottom</span>
            置底
          </button>
          <div class="w-px h-5 bg-outline-variant mx-1" />
          <button
            class="flex items-center gap-1.5 text-sm font-bold text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-colors"
            onClick={() => canvasAPI?.removeSelected()}
            aria-label="删除选中对象"
          >
            <span class="material-symbols-outlined">delete</span>
            删除
          </button>
        </div>
      </Show>
    </section>
  )
}
