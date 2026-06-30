import {
  createSignal,
  createMemo,
  Show,
  onMount,
  onCleanup,
  createEffect
} from 'solid-js'
import DesignCanvas from './design/DesignCanvas'
import DesignHeader from './design/DesignHeader'
import ToolDock from './design/ToolDock'
import PanelSheet from './design/PanelSheet'
import CartBar from './design/CartBar'
import ColorPanel from './design/panels/ColorPanel'
import TextPanel from './design/panels/TextPanel'
import AssetsPanel from './design/panels/AssetsPanel'
import DrawingPanel from './design/panels/DrawingPanel'
import ProductSelector from './design/panels/ProductSelector'
import { TSHIRT_COLORS, DEFAULT_CANVAS_INK, DEFAULT_DRAWING_COLOR, type DesignTool, type BrushStyle } from './design/design-types'
import type { CanvasAPI } from '../ui/FabricCanvas'
import { api } from '../../lib/api'
import { refreshCartCount } from '../../lib/cartStore'
import { showToast } from '../../lib/toast'

const FALLBACK_IMAGE = '/tshirt.png'
const FALLBACK_MASK = '/tshirt-mask.png'
const DEFAULT_PRODUCT_ID = 1

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function defaultDesignName(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `未命名设计 ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DesignWorkshop() {
  const [activeTool, setActiveTool] = createSignal<DesignTool | null>(null)
  const [drawingActive, setDrawingActive] = createSignal(false)
  const [tshirtColor, setTshirtColor] = createSignal(TSHIRT_COLORS[0].hex)
  const [drawingColor, setDrawingColor] = createSignal(DEFAULT_DRAWING_COLOR)
  const [drawingSize, setDrawingSize] = createSignal(1)
  const [drawingMode, setDrawingMode] = createSignal<'brush' | 'move'>('brush')
  const [drawingStyle, setDrawingStyle] = createSignal<BrushStyle>('pencil')

  const drawing = createMemo(() => ({
    enabled: drawingActive(),
    mode: drawingMode(),
    color: drawingColor(),
    size: drawingSize(),
    style: drawingStyle()
  }))

  const [currentDesignId, setCurrentDesignId] = createSignal<number | null>(null)
  const [designName, setDesignName] = createSignal(defaultDesignName())
  const [dirty, setDirty] = createSignal(false)
  const [saveState, setSaveState] = createSignal<SaveState>('idle')
  const [hasDrawing, setHasDrawing] = createSignal(false)
  const [canUndo, setCanUndo] = createSignal(false)
  const [ready, setReady] = createSignal(false)
  const [initState, setInitState] = createSignal<'loading' | 'ready'>('loading')
  let pendingDesignCanvas: { canvas: any; wrapped: any } | null = null
  const [editingText, setEditingText] = createSignal<{ text: string } | null>(null)
  const [editingName, setEditingName] = createSignal(false)
  const [nameDraft, setNameDraft] = createSignal('')

  const [product, setProduct] = createSignal<any>(null)
  const [currentProductId, setCurrentProductId] = createSignal<number>(DEFAULT_PRODUCT_ID)
  const [productImage, setProductImage] = createSignal(FALLBACK_IMAGE)
  const [productMask, setProductMask] = createSignal(FALLBACK_MASK)
  const [selectedSize, setSelectedSize] = createSignal('M')
  const [quantity, setQuantity] = createSignal(1)
  const [addingCart, setAddingCart] = createSignal(false)
  const [showSavePrompt, setShowSavePrompt] = createSignal(false)
  const [pendingProduct, setPendingProduct] = createSignal<any>(null)

  const colorToName: Record<string, string> = Object.fromEntries(TSHIRT_COLORS.map(c => [c.hex, c.name]))

  let canvasAPI: CanvasAPI | null = null
  let saveToken = 0

  const handleToolChange = (tool: DesignTool) => {
    if (tool === activeTool()) {
      if (tool === 'drawing') setDrawingActive(false)
      setActiveTool(null)
      return
    }
    if (tool !== 'drawing') setDrawingActive(false)
    if (tool === 'drawing') setDrawingActive(true)
    if (tool === 'text') {
      const selected = canvasAPI?.getSelectedText()
      setEditingText(selected ? { text: selected.text } : null)
    }
    setActiveTool(tool)
  }

  const handleCanvasReady = (api: CanvasAPI) => {
    canvasAPI = api
    setReady(true)
    if (pendingDesignCanvas) {
      const { canvas, wrapped } = pendingDesignCanvas
      pendingDesignCanvas = null
      const scale = computeLoadScale(api.getInternalWidth(), wrapped)
      void api.loadJSON(canvas, scale).then(() => setDirty(false))
    }
  }

  const bootstrap = async () => {
    const params = new URLSearchParams(window.location.search)

    const productId = params.get('product')
    if (productId) {
      const pid = parseInt(productId)
      if (!isNaN(pid)) {
        await loadProduct(pid, false)
        setInitState('ready')
        return
      }
    }

    const id = params.get('design')
    if (id) {
      const designId = parseInt(id)
      if (!isNaN(designId)) {
        await loadDesignWithProduct(designId)
        setInitState('ready')
        return
      }
    }

    await loadProduct(DEFAULT_PRODUCT_ID, false)
    setInitState('ready')
  }

  const reloadCanvasImages = () => {
    const img = productImage()
    const mask = productMask() || img.replace(/\.[^.]+$/, '-mask.png')
    canvasAPI?.reloadImages(img, mask)
  }

  const handleCanvasChange = () => {
    if (!ready()) return
    setDirty(true)
    if (canvasAPI) {
      const count = canvasAPI.getDrawingCount()
      setHasDrawing(count > 0)
      setCanUndo(count > 0)
    }
  }

  const loadProduct = async (id: number, reload = true) => {
    setCurrentProductId(id)
    try {
      const [productRes, baseDesignRes] = await Promise.all([
        api.products.get(String(id)),
        api.products.baseDesign(String(id)).catch(() => ({
          data: { originalImage: null, frontImage: null, maskImage: null }
        }))
      ])
      const p = productRes.data
      const bd = baseDesignRes.data
      setProduct(p)
      setProductImage(bd.frontImage || FALLBACK_IMAGE)
      setProductMask(bd.maskImage || FALLBACK_MASK)
      const allSizes = [...new Set((p.variants?.map((v: any) => v.size) || []) as string[])].sort()
      if (allSizes.length) setSelectedSize(allSizes[0])
      if (reload) reloadCanvasImages()
    } catch {
      setProductImage(FALLBACK_IMAGE)
      setProductMask(FALLBACK_MASK)
      if (reload) reloadCanvasImages()
    }
  }

  const computeLoadScale = (currentInternalWidth: number, wrapped: any): number => {
    const savedCanvasWidth = wrapped?.canvasWidth
    if (savedCanvasWidth && savedCanvasWidth > 0) {
      return currentInternalWidth / savedCanvasWidth
    }
    const savedRatio = wrapped?.renderRatio || 1
    return 2 / savedRatio
  }

  const loadDesignWithProduct = async (id: number) => {
    try {
      const res = await api.designs.get(id)
      setCurrentDesignId(res.data.id)
      setDesignName(res.data.name)

      let canvas: any
      let wrapped: any
      if (res.data.canvasData) {
        wrapped = JSON.parse(res.data.canvasData)
        if (wrapped?.tshirtColor) {
          setTshirtColor(wrapped.tshirtColor)
        }
        canvas = wrapped?.canvas ?? wrapped
      }

      const [productRes, baseDesignRes] = await Promise.all([
        api.products.get(String(res.data.productId)),
        api.products.baseDesign(String(res.data.productId)).catch(() => ({
          data: { originalImage: null, frontImage: null, maskImage: null }
        }))
      ])
      const p = productRes.data
      const bd = baseDesignRes.data
      const frontImage = bd.frontImage || FALLBACK_IMAGE
      const maskImage = bd.maskImage || frontImage.replace(/\.[^.]+$/, '-mask.png')
      setProduct(p)
      setProductImage(frontImage)
      setProductMask(maskImage)

      if (canvas) {
        if (canvasAPI) {
          await canvasAPI.reloadImages(frontImage, maskImage)
          const scale = computeLoadScale(canvasAPI.getInternalWidth(), wrapped)
          await canvasAPI.loadJSON(canvas, scale)
        } else {
          pendingDesignCanvas = { canvas, wrapped }
        }
      } else if (canvasAPI) {
        await canvasAPI.reloadImages(frontImage, maskImage)
      }

      setDirty(false)
    } catch {
      showToast('加载设计失败')
    }
  }

  const collectSavePayload = (): {
    productId: number
    name: string
    canvasData: string
    previewImage: string | null
  } | null => {
    if (!canvasAPI) return null
    const json = canvasAPI.toJSON()
    if (!json) return null
    let previewImage: string | null = null
    try {
      previewImage = canvasAPI.toDataURL({ format: 'png' })
    } catch {}
    const wrapped = {
      tshirtColor: tshirtColor(),
      canvas: json,
      renderRatio: 2,
      canvasWidth: canvasAPI.getInternalWidth()
    }
    return {
      productId: currentProductId(),
      name: designName(),
      canvasData: JSON.stringify(wrapped),
      previewImage
    }
  }

  const save = async (): Promise<{ id: number; previewImage: string | null } | null> => {
    if (!canvasAPI) return null
    const payload = collectSavePayload()
    if (!payload) return null
    const token = ++saveToken
    setSaveState('saving')
    try {
      const id = currentDesignId()
      if (id) {
        const res = await api.designs.update(id, payload)
        setSaveState('saved')
        const prevUrl = res.data && 'previewImage' in res.data ? res.data.previewImage : null
        return { id, previewImage: prevUrl }
      } else {
        const res = await api.designs.create(payload)
        if (token !== saveToken) return null
        setCurrentDesignId(res.data.id)
        const url = new URL(window.location.href)
        url.searchParams.set('design', String(res.data.id))
        window.history.replaceState({}, '', url.toString())
        setSaveState('saved')
        return { id: res.data.id, previewImage: res.data.previewImage }
      }
    } catch (err: any) {
      if (token !== saveToken) return null
      showToast(err?.message || '保存失败')
      setSaveState('error')
      return null
    } finally {
      setTimeout(() => {
        if (token === saveToken && saveState() === 'saved') setSaveState('idle')
      }, 1500)
    }
  }

  const autoSaveOnHide = () => {
    if (!dirty() || !canvasAPI) return
    const payload = collectSavePayload()
    if (!payload) return
    void api.designs.saveBeacon(payload, currentDesignId() ?? undefined)
  }

  onMount(() => {
    void bootstrap()
    const onHide = () => autoSaveOnHide()
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') onHide()
    }
    window.addEventListener('pagehide', onHide)
    window.addEventListener('visibilitychange', onVisChange)
    onCleanup(() => {
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('visibilitychange', onVisChange)
    })
  })

  createEffect(() => {
    if (ready() && saveState() === 'saved') {
      setDirty(false)
    }
  })

  const startEditName = () => {
    setNameDraft(designName())
    setEditingName(true)
  }

  const commitName = async () => {
    const trimmed = nameDraft().trim()
    if (trimmed) {
      setDesignName(trimmed)
      if (ready() && canvasAPI) {
        setDirty(true)
        await save()
      }
    }
    setEditingName(false)
  }

  const variantSizes = () => [...new Set((product()?.variants?.map((v: any) => v.size) || []) as string[])].sort()
  const variantColors = () => [...new Set((product()?.variants?.map((v: any) => v.color).filter(Boolean) || []) as string[])]

  const resolvedVariantColor = createMemo(() => {
    const colors = variantColors()
    if (!colors.length) return ''
    const mapped = colorToName[tshirtColor()]?.toLowerCase()
    const matched = colors.find((c: string) => c.toLowerCase() === mapped)
    return matched || colors[0]
  })

  const selectedVariant = createMemo(() =>
    product()?.variants?.find((v: any) => v.size === selectedSize() && v.color === resolvedVariantColor())
  )
  const totalPrice = createMemo(() => {
    const base = product()?.basePrice ?? 0
    const adj = selectedVariant()?.priceAdjustment ?? 0
    return (base + adj) * quantity()
  })

  const handleAddToCart = async () => {
    if (!canvasAPI) return
    const variant = selectedVariant()
    if (!variant) {
      showToast('所选规格不存在')
      return
    }
    setAddingCart(true)
    try {
      const saved = await save()
      if (!saved) return
      await api.cart.addDesign(currentProductId(), variant.id, saved.id, quantity())
      showToast('已加入购物车')
      refreshCartCount()
    } catch (err: any) {
      showToast(err.message || '操作失败')
    } finally {
      setAddingCart(false)
    }
  }

  const handleSelectProduct = (p: any) => {
    if (dirty() && canvasAPI) {
      setPendingProduct(p)
      setShowSavePrompt(true)
    } else {
      void doSwitchProduct(p)
    }
  }

  const doSwitchProduct = async (p: any) => {
    setTshirtColor(TSHIRT_COLORS[0].hex)
    await loadProduct(p.id)
    canvasAPI?.clearDesign()
    setCurrentDesignId(null)
    setDesignName(defaultDesignName())
    const url = new URL(window.location.href)
    url.searchParams.delete('design')
    window.history.replaceState({}, '', url.toString())
    setDirty(false)
    setActiveTool('color')
  }

  const handleAddText = (opts: { text: string }) => {
    canvasAPI?.addText({
      text: opts.text,
      font: 'Manrope',
      color: DEFAULT_CANVAS_INK,
      size: 32,
      letterSpacing: 0,
      bold: false,
      italic: false
    })
    setEditingText({ text: opts.text })
  }

  const handleUpdateText = (opts: { text: string }) => {
    const current = canvasAPI?.getSelectedText()
    if (current) {
      canvasAPI?.updateText({ ...current, text: opts.text })
    }
  }

  return (
    <div class="flex flex-col bg-background text-on-surface overflow-hidden h-[calc(100dvh-64px)] md:mt-16 md:h-[calc(100vh-64px)]">
      <DesignHeader
        designName={designName()}
        editingName={editingName()}
        nameDraft={nameDraft()}
        saveState={saveState()}
        dirty={dirty()}
        currentDesignId={currentDesignId()}
        ready={ready()}
        onSave={() => void save()}
        onStartEditName={startEditName}
        onCommitName={() => void commitName()}
        onCancelEditName={() => setEditingName(false)}
        onNameDraftChange={setNameDraft}
      />

      <div class="flex-1 relative overflow-hidden">
        {/* Canvas centered */}
        <div
          class="absolute inset-0 flex items-center justify-center p-4 md:transition-all md:duration-300 md:ease-out"
          classList={{ 'md:pl-[25rem]': activeTool() !== null }}
        >
          <Show
            when={initState() === 'ready'}
            fallback={
              <div class="aspect-[4/5] w-full max-w-sm rounded-xl bg-surface-container flex items-center justify-center">
                <span class="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
              </div>
            }
          >
            <DesignCanvas
              tshirtImage={productImage()}
              maskImage={productMask()}
              tshirtColor={tshirtColor()}
              drawing={drawing()}
              onReady={handleCanvasReady}
              onChange={handleCanvasChange}
            />
          </Show>
        </div>

        {/* Tool Dock */}
        <ToolDock activeTool={activeTool()} onToolChange={handleToolChange} />

        {/* Panel Sheet */}
        <PanelSheet activeTool={activeTool()} onClose={() => setActiveTool(null)}>
          <Show when={activeTool() === 'product'}>
            <ProductSelector
              selectedProductId={currentProductId()}
              onSelect={handleSelectProduct}
            />
          </Show>
          <Show when={activeTool() === 'color'}>
            <ColorPanel selectedColor={tshirtColor()} onColorChange={setTshirtColor} />
          </Show>
          <Show when={activeTool() === 'text'}>
            <TextPanel
              editingText={editingText()}
              onAddText={handleAddText}
              onUpdateText={handleUpdateText}
            />
          </Show>
          <Show when={activeTool() === 'assets'}>
            <AssetsPanel
              onAddImage={(opts) => { void canvasAPI?.addImage(opts) }}
            />
          </Show>
          <Show when={activeTool() === 'drawing'}>
            <DrawingPanel
              mode={drawingMode()}
              color={drawingColor()}
              size={drawingSize()}
              style={drawingStyle()}
              onModeChange={setDrawingMode}
              onColorChange={setDrawingColor}
              onSizeChange={setDrawingSize}
              onStyleChange={setDrawingStyle}
              onUndo={() => canvasAPI?.undo()}
              onClear={() => canvasAPI?.clearDrawing()}
              canUndo={canUndo()}
              hasDrawing={hasDrawing()}
            />
          </Show>
        </PanelSheet>

        {/* Cart Bar */}
        <Show when={product()}>
          <CartBar
            productName={product()?.name ?? ''}
            totalPrice={totalPrice()}
            selectedSize={selectedSize()}
            quantity={quantity()}
            variantSizes={variantSizes()}
            addingCart={addingCart()}
            onSizeChange={setSelectedSize}
            onQuantityChange={(delta) => setQuantity((q) => Math.max(1, q + delta))}
            onAddToCart={() => void handleAddToCart()}
          />
        </Show>
      </div>

      {/* Save Prompt Dialog */}
      <Show when={showSavePrompt()}>
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6" onClick={() => setShowSavePrompt(false)}>
          <div class="bg-surface rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-elevated border border-outline-variant" onClick={(e) => e.stopPropagation()}>
            <h3 class="font-headline text-lg font-bold text-on-surface">保存当前设计？</h3>
            <p class="text-body-sm text-on-surface-variant">切换基础款将丢失当前设计内容</p>
            <div class="flex flex-col gap-2">
              <button
                class="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-body-sm hover:opacity-90 transition-opacity"
                onClick={async () => {
                  setShowSavePrompt(false)
                  await save()
                  const p = pendingProduct()
                  if (p) void doSwitchProduct(p)
                }}
              >
                保存
              </button>
              <button
                class="w-full h-11 rounded-xl bg-surface-container-high text-on-surface font-bold text-body-sm hover:bg-surface-container transition-colors"
                onClick={() => {
                  setShowSavePrompt(false)
                  const p = pendingProduct()
                  if (p) void doSwitchProduct(p)
                }}
              >
                放弃
              </button>
              <button
                class="w-full h-11 rounded-xl text-on-surface-variant font-bold text-body-sm hover:bg-surface-container-high transition-colors"
                onClick={() => setShowSavePrompt(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
