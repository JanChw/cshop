import {
  createSignal,
  createMemo,
  Show,
  For,
  onMount,
  onCleanup,
  createEffect
} from 'solid-js'
import DesignCanvas from './design/DesignCanvas'
import ColorPanel from './design/panels/ColorPanel'
import TextPanel from './design/panels/TextPanel'
import AssetsPanel from './design/panels/AssetsPanel'
import DrawingPanel from './design/panels/DrawingPanel'
import { DESIGN_TABS, TSHIRT_COLORS, type DesignTab, type BrushStyle } from './design/design-types'
import type { CanvasAPI } from '../ui/FabricCanvas'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

const TSHIRT_IMAGE = '/tshirt.png'
const DEFAULT_PRODUCT_ID = 1
const DEFAULT_VARIANT_ID: number | null = null

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function defaultDesignName(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `未命名设计 ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DesignWorkshop() {
  const [activeTab, setActiveTab] = createSignal<DesignTab>('color')
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [tshirtColor, setTshirtColor] = createSignal(TSHIRT_COLORS[0].hex)
  const [bgColor] = createSignal('transparent')
  const [drawingColor, setDrawingColor] = createSignal('#0052FF')
  const [drawingSize, setDrawingSize] = createSignal(5)
  const [drawingMode, setDrawingMode] = createSignal<'brush' | 'move'>('brush')
  const [drawingStyle, setDrawingStyle] = createSignal<BrushStyle>('pencil')

  const drawing = createMemo(() => ({
    enabled: activeTab() === 'drawing',
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
  const [editingText, setEditingText] = createSignal<{ text: string } | null>(null)
  const [editingName, setEditingName] = createSignal(false)
  const [nameDraft, setNameDraft] = createSignal('')

  const [product, setProduct] = createSignal<any>(null)
  const [selectedSize, setSelectedSize] = createSignal('M')
  const [quantity, setQuantity] = createSignal(1)
  const [addingCart, setAddingCart] = createSignal(false)

  const colorToName: Record<string, string> = {
    '#ffffff': '白色',
    '#1a1a1a': '黑色',
    '#b5b5b5': '灰色',
    '#c2652a': '棕色',
    '#2d4a3e': '绿色',
    '#8c3c3c': '红色'
  }

  let canvasAPI: CanvasAPI | null = null
  let nameInputRef: HTMLInputElement | undefined
  let saveToken = 0

  const handleColorChange = (hex: string) => {
    setTshirtColor(hex)
  }

  const handleCanvasReady = (api: CanvasAPI) => {
    canvasAPI = api
    setReady(true)
    const params = new URLSearchParams(window.location.search)
    const id = params.get('design')
    if (id) {
      const designId = parseInt(id)
      if (!isNaN(designId)) {
        loadDesign(designId)
      }
    }
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

  const loadDesign = async (id: number) => {
    try {
      const res = await api.designs.get(id)
      setCurrentDesignId(res.data.id)
      setDesignName(res.data.name)
      if (res.data.canvasData) {
        const wrapped = JSON.parse(res.data.canvasData)
        if (wrapped?.tshirtColor) {
          setTshirtColor(wrapped.tshirtColor)
        }
        const canvas = wrapped?.canvas ?? wrapped
        const savedRatio = wrapped?.renderRatio || 1
        const scale = 2 / savedRatio
        await canvasAPI?.loadJSON(canvas, scale)
      }
      setDirty(false)
    } catch (err) {
      showToast('加载设计失败')
    }
  }

  const collectSavePayload = (): {
    productId: number
    variantId: number | null
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
    const wrapped = { tshirtColor: tshirtColor(), canvas: json, renderRatio: 2 }
    return {
      productId: DEFAULT_PRODUCT_ID,
      variantId: DEFAULT_VARIANT_ID,
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
    const id = currentDesignId()
    const url = id ? `/api/v1/designs/${id}` : '/api/v1/designs'
    const method = id ? 'PUT' : 'POST'
    const token = getToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const body = JSON.stringify(payload)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
    } else {
      void fetch(url, { method, headers, body, keepalive: true }).catch(() => {})
    }
  }

  const getToken = (): string | null => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem('cshop_token')
  }

  onMount(() => {
    const onHide = () => autoSaveOnHide()
    window.addEventListener('pagehide', onHide)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide()
    })
    onCleanup(() => {
      window.removeEventListener('pagehide', onHide)
    })

    void api.products.get(String(DEFAULT_PRODUCT_ID)).then((res) => {
      const p = res.data
      setProduct(p)
      const allSizes = [...new Set((p.variants?.map((v: any) => v.size) || []) as string[])].sort()
      if (allSizes.length) setSelectedSize(allSizes[0])
    }).catch(() => {
      showToast('加载商品信息失败')
    })
  })

  createEffect(() => {
    if (ready() && saveState() === 'saved') {
      setDirty(false)
    }
  })

  const dirtyDot = () => dirty() && currentDesignId() !== null

  const showSaveIndicator = () => {
    if (!ready()) return { text: '加载中...', color: 'text-secondary' }
    const s = saveState()
    if (s === 'saving') return { text: '保存中...', color: 'text-secondary' }
    if (s === 'error') return { text: '保存失败', color: 'text-error' }
    if (currentDesignId() === null) return { text: '未保存', color: 'text-secondary' }
    if (dirty()) return { text: '有未保存修改', color: 'text-secondary' }
    return { text: '已保存', color: 'text-primary' }
  }

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

  const cancelEditName = () => setEditingName(false)

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

  const handleAddToCart = async (buyNow: boolean) => {
    if (!canvasAPI) return
    const variant = selectedVariant()
    if (!variant) {
      showToast('所选规格不存在')
      return
    }
    setAddingCart(true)
    try {
      const saved = await save()
      if (!saved) {
        showToast('保存设计失败，请重试')
        return
      }
      await api.cart.addDesign(DEFAULT_PRODUCT_ID, variant.id, saved.id, quantity())
      showToast(buyNow ? '已保存，正在跳转购物车' : '已加入购物车')
      if (buyNow) {
        window.location.href = '/cart'
      }
    } catch (err: any) {
      showToast(err.message || '操作失败')
    } finally {
      setAddingCart(false)
    }
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface" style="font-family: 'Manrope', sans-serif">
      <header class="bg-surface sticky top-0 z-[60] flex justify-between items-center px-4 h-16 w-full border-b border-outline-variant">
        <button
          class="p-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 duration-100"
          onClick={() => setDrawerOpen(true)}
          aria-label="菜单"
        >
          <span class="material-symbols-outlined text-primary">menu</span>
        </button>
        <div class="flex flex-col items-center">
          <Show
            when={editingName()}
            fallback={(
              <button
                class="font-headline text-xl font-bold tracking-tight text-primary leading-tight flex items-center gap-1"
                onClick={startEditName}
                aria-label="编辑设计名称"
              >
                {designName()}
                <span class="material-symbols-outlined text-base text-secondary">edit</span>
              </button>
            )}
          >
            <input
              ref={(el) => { nameInputRef = el; if (el) el.focus() }}
              class="font-headline text-xl font-bold tracking-tight text-primary leading-tight text-center bg-transparent border-b-2 border-primary outline-none min-w-[160px] max-w-[200px]"
              value={nameDraft()}
              onInput={(e) => setNameDraft(e.currentTarget.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') cancelEditName()
              }}
              maxLength={40}
            />
          </Show>
          <div class="flex items-center gap-1.5 leading-none">
            <Show when={dirtyDot()}>
              <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
            </Show>
            <span class={`text-[10px] font-medium ${showSaveIndicator().color}`}>
              {showSaveIndicator().text}
            </span>
          </div>
        </div>
        <button
          class="p-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 duration-100"
          onClick={() => void save()}
          aria-label="保存"
          disabled={saveState() === 'saving'}
        >
          <span class="material-symbols-outlined text-primary">bookmark</span>
        </button>
      </header>

      <main class="px-4 max-w-md mx-auto pb-28">
        <Show when={product()}>
          <div class="sticky top-16 z-[55] -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-outline-variant/30">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-[10px] text-on-surface-variant truncate">{product()?.name}</p>
                <p class="text-lg font-bold text-primary leading-tight">
                  ¥ {totalPrice().toFixed(2)}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <select
                  value={selectedSize()}
                  onChange={(e) => setSelectedSize(e.currentTarget.value)}
                  class="h-8 pl-2 pr-6 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                >
                  <For each={variantSizes()}>
                    {(s) => <option value={s}>{s}</option>}
                  </For>
                </select>
                <div class="flex items-center gap-1">
                  <button
                    class="w-7 h-7 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    aria-label="减少数量"
                  >
                    <span class="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span class="w-5 text-center text-xs font-bold text-on-surface">{quantity()}</span>
                  <button
                    class="w-7 h-7 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                    onClick={() => setQuantity(q => q + 1)}
                    aria-label="增加数量"
                  >
                    <span class="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <button
                  class="h-8 px-3 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                  onClick={() => handleAddToCart(false)}
                  disabled={addingCart()}
                >
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </Show>

        <DesignCanvas
          tshirtImage={TSHIRT_IMAGE}
          tshirtColor={tshirtColor()}
          bgColor={bgColor()}
          drawing={drawing()}
          onReady={handleCanvasReady}
          onChange={handleCanvasChange}
        />

        <nav class="mt-6 flex overflow-x-auto gap-6 border-b border-outline-variant/30 pb-2" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
          {DESIGN_TABS.map((t) => (
            <button
              class={`flex-shrink-0 text-sm font-body whitespace-nowrap pb-2 transition-colors ${
                activeTab() === t.key
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => {
                if (t.key === 'text') {
                  const selected = canvasAPI?.getSelectedText()
                  setEditingText(selected ? { text: selected.text } : null)
                }
                setActiveTab(t.key)
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <Show when={activeTab() === 'color'}>
          <ColorPanel selectedColor={tshirtColor()} onColorChange={handleColorChange} />
        </Show>
        <Show when={activeTab() === 'text'}>
          <TextPanel
            editingText={editingText()}
            onAddText={(opts) => {
              canvasAPI?.addText({
                text: opts.text,
                font: 'Manrope',
                color: '#000000',
                size: 32,
                letterSpacing: 0,
                bold: false,
                italic: false
              })
            }}
            onUpdateText={(opts) => {
              const current = canvasAPI?.getSelectedText()
              if (current) {
                canvasAPI?.updateText({ ...current, text: opts.text })
              }
              setActiveTab('color')
            }}
          />
        </Show>
        <Show when={activeTab() === 'assets'}>
          <AssetsPanel
            onAddImage={(opts) => {
              void canvasAPI?.addImage(opts)
            }}
          />
        </Show>
        <Show when={activeTab() === 'drawing'}>
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

      </main>

      <nav class="fixed bottom-0 w-full z-[60] flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant h-20">
        <a href="/" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all active:scale-90 duration-150">
          <span class="material-symbols-outlined">home</span>
          <span class="text-[10px] font-medium mt-0.5">首页</span>
        </a>
        <a href="/design" class="flex flex-col items-center justify-center relative px-4 py-1.5 active:scale-90 duration-150">
          <div class="bg-primary-container absolute inset-0 rounded-2xl"></div>
          <span class="material-symbols-outlined relative z-10 text-on-primary-container" style="font-variation-settings: 'FILL' 1">draw</span>
          <span class="text-[10px] font-bold mt-0.5 relative z-10 text-on-primary-container">设计</span>
        </a>
        <a href="/cart" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all active:scale-90 duration-150">
          <span class="material-symbols-outlined">shopping_cart</span>
          <span class="text-[10px] font-medium mt-0.5">购物车</span>
        </a>
        <a href="/shop" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all active:scale-90 duration-150">
          <span class="material-symbols-outlined">storefront</span>
          <span class="text-[10px] font-medium mt-0.5">商店</span>
        </a>
        <a href="/person" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary transition-all active:scale-90 duration-150">
          <span class="material-symbols-outlined">person</span>
          <span class="text-[10px] font-medium mt-0.5">我的</span>
        </a>
      </nav>

      <div class={`fixed inset-y-0 left-0 z-[70] w-72 bg-surface border-r border-outline-variant transform transition-transform duration-300 ease-in-out ${drawerOpen() ? 'translate-x-0' : '-translate-x-full'}`}>
        <div class="p-6 flex flex-col h-full">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <h3 class="font-bold text-on-surface">ByChooow 用户</h3>
              <p class="text-xs text-on-surface-variant">设计师</p>
            </div>
          </div>
          <nav class="space-y-1">
            <a class="flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/person/designs">
              <span class="material-symbols-outlined">palette</span>
              我的设计
            </a>
            <a class="flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/order">
              <span class="material-symbols-outlined">package_2</span>
              订单查询
            </a>
            <a class="flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/person/collection">
              <span class="material-symbols-outlined">favorite</span>
              收藏夹
            </a>
            <a class="flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/person">
              <span class="material-symbols-outlined">settings</span>
              设置
            </a>
          </nav>
        </div>
      </div>
      <div
        class={`fixed inset-0 bg-black/40 z-[65] transition-opacity duration-300 ${drawerOpen() ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
      />

      <style>{`
        input[type="range"] {
          accent-color: #c2652a;
          -webkit-appearance: none;
          background: #eae2da;
          height: 4px;
          border-radius: 2px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #c2652a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #c2652a;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
      `}</style>
    </div>
  )
}
