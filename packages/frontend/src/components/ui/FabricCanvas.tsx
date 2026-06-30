import { onMount, onCleanup, createEffect } from 'solid-js'
import {
  Canvas,
  CircleBrush,
  FabricImage,
  FabricObject,
  IText,
  PencilBrush,
  Rect,
  SprayBrush,
  filters,
  util
} from 'fabric'
import { DEFAULT_CANVAS_INK } from '../page/design/design-types'

export interface DesignText {
  text: string
  font: string
  color: string
  size: number
  letterSpacing: number
  bold: boolean
  italic: boolean
}

export interface DesignImage {
  url: string
  maxWidth?: number
  maxHeight?: number
}

export interface CanvasAPI {
  addText: (opts: DesignText) => void
  addImage: (opts: DesignImage) => Promise<void>
  removeSelected: () => void
  undo: () => void
  clearDrawing: () => void
  toJSON: () => any
  toDataURL: (opts?: { width?: number; height?: number; format?: 'png' | 'jpeg' }) => string
  loadJSON: (json: any, scale?: number) => Promise<void>
  getInternalWidth: () => number
  isEmpty: () => boolean
  hasActiveObject: () => boolean
  getDrawingCount: () => number
  getSelectedText: () => DesignText | null
  updateText: (opts: DesignText) => void
  setTextColor: (hex: string) => void
  setTextFont: (font: string) => void
  setTextSize: (delta: number) => void
  setTextBold: (bold: boolean) => void
  setTextItalic: (italic: boolean) => void
  setTextLetterSpacing: (delta: number) => void
  bringToFront: () => void
  sendToBack: () => void
  reloadImages: (imgSrc: string, maskSrc?: string) => Promise<void>
  clearDesign: () => void
}

interface Props {
  tshirtImage: string
  tshirtColor: string
  maskImage?: string
  drawing: { enabled: boolean; mode?: 'brush' | 'move'; color: string; size: number; style?: 'pencil' | 'marker' | 'spray' }
  interactive?: boolean
  onReady?: (api: CanvasAPI) => void
  onChange?: () => void
  onSelectionChange?: (hasSelection: boolean) => void
}

const TSHIRT_LAYER_KEY = 'tshirt'
const WHITE_BG_KEY = 'white-bg'
const DRAWING_LAYER_KEY = 'drawing'
const RENDER_RATIO = 2

export default function FabricCanvas(props: Props) {
  let canvasEl: HTMLCanvasElement | undefined
  let fabricCanvas: Canvas | undefined
  let tshirtBase: FabricImage | undefined
  let whiteBg: Rect | undefined
  let colorFilter: filters.BlendColor | undefined
  const drawingPaths: FabricObject[] = []
  const changeListeners: Array<() => void> = []
  let swappingProduct = false
  let loadedImgSrc = ''
  let loadedMaskSrc = ''


  const isTshirtLayer = (obj: FabricObject | undefined) =>
    obj !== undefined && obj === tshirtBase
  const isBgLayer = (obj: FabricObject | undefined) =>
    obj !== undefined && (obj as any).data?.kind === WHITE_BG_KEY

  const fireChange = () => {
    if (swappingProduct) return
    for (const cb of changeListeners) cb()
    props.onChange?.()
  }

  const ensureTextOnTop = () => {
    if (!fabricCanvas) return
    const texts = fabricCanvas
      .getObjects()
      .filter((o) => (o as any).data?.kind === 'text')
    for (const t of texts) {
      fabricCanvas.bringObjectToFront(t)
    }
    fabricCanvas.renderAll()
  }

  onMount(() => {
    if (!canvasEl) return
    const parent = canvasEl.parentElement
    const logicalWidth = parent?.clientWidth || 300
    const logicalHeight = parent?.clientHeight || 375
    const width = logicalWidth * RENDER_RATIO
    const height = logicalHeight * RENDER_RATIO

    fabricCanvas = new Canvas(canvasEl, {
      width,
      height,
      selection: props.interactive !== false,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      enableRetinaScaling: false
    })

    const whiteBgRect = new Rect({
      left: 0, top: 0,
      width, height,
      fill: '#ffffff',
      selectable: false, evented: false,
      excludeFromExport: true
    })
    ;(whiteBgRect as any).data = { kind: WHITE_BG_KEY }
    whiteBg = whiteBgRect
    fabricCanvas.add(whiteBg)

    fabricCanvas.setDimensions(
      { width: logicalWidth, height: logicalHeight },
      { cssOnly: true }
    )

    const brush = new PencilBrush(fabricCanvas)
    brush.color = props.drawing.color
    brush.width = props.drawing.size * RENDER_RATIO
    fabricCanvas.freeDrawingBrush = brush

    fabricCanvas.on('object:modified', (e) => {
      if (e.target && !isTshirtLayer(e.target)) fireChange()
    })
    fabricCanvas.on('object:added', (e) => {
      const obj = e.target as FabricObject | undefined
      if (obj && !isTshirtLayer(obj)) {
        fireChange()
        ensureTextOnTop()
      }
    })
    fabricCanvas.on('object:removed', (e) => {
      const obj = e.target as FabricObject | undefined
      if (obj && !isTshirtLayer(obj)) fireChange()
    })
    fabricCanvas.on('path:created', (e: any) => {
      if (e.path) {
        ;(e.path as any).data = { kind: DRAWING_LAYER_KEY }
        drawingPaths.push(e.path)
        fabricCanvas?.renderAll()
        fireChange()
      }
    })

    const reportSelection = () => {
      const active = fabricCanvas?.getActiveObject()
      const hasSelection = active !== undefined && active !== null && !isTshirtLayer(active as FabricObject)
      props.onSelectionChange?.(hasSelection)
    }
    fabricCanvas.on('selection:created', reportSelection)
    fabricCanvas.on('selection:updated', reportSelection)
    fabricCanvas.on('selection:cleared', reportSelection)

    const initImgSrc = props.tshirtImage
    const initMaskSrc = props.maskImage || initImgSrc.replace(/\.[^.]+$/, '-mask.png')
    const baseImg = new Image()
    baseImg.onload = () => {
      if (!fabricCanvas) return

      const maskImg = new Image()
      maskImg.onload = () => {
        if (!fabricCanvas) return

        const naturalW = baseImg.naturalWidth || maskImg.naturalWidth || 1024
        const naturalH = baseImg.naturalHeight || maskImg.naturalHeight || 1024
        const scale = Math.min(logicalWidth / naturalW, logicalHeight / naturalH) * 0.52 * RENDER_RATIO

        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = naturalW
        tmpCanvas.height = naturalH
        const ctx = tmpCanvas.getContext('2d')!
        ctx.drawImage(baseImg, 0, 0, naturalW, naturalH)
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(maskImg, 0, 0, naturalW, naturalH)
        ctx.globalCompositeOperation = 'source-over'

        tshirtBase = new FabricImage(tmpCanvas, {
          scaleX: scale,
          scaleY: scale,
          left: width / 2,
          top: height / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          objectCaching: false,
          excludeFromExport: true
        })
        ;(tshirtBase as any).data = { kind: TSHIRT_LAYER_KEY }
        fabricCanvas.add(tshirtBase)

        colorFilter = new filters.BlendColor({
          color: props.tshirtColor,
          mode: 'multiply',
          alpha: 1
        })
        tshirtBase.filters = [colorFilter]
        tshirtBase.applyFilters()

        fabricCanvas.renderAll()
        loadedImgSrc = initImgSrc
        loadedMaskSrc = initMaskSrc
        props.onReady?.(buildAPI())
      }
      maskImg.onerror = () => {
        console.error('Failed to load tshirt mask:', initMaskSrc)
        fabricCanvas?.renderAll()
        props.onReady?.(buildAPI())
      }
      maskImg.src = initMaskSrc
    }
    baseImg.onerror = () => {
    }
    baseImg.src = initImgSrc
  })

  createEffect(() => {
    if (!fabricCanvas) return
    fabricCanvas.selection = props.interactive !== false
  })

  createEffect(() => {
    const color = props.tshirtColor
    if (!tshirtBase || !fabricCanvas || !colorFilter) return
    colorFilter.color = color
    tshirtBase.applyFilters()
    fabricCanvas.renderAll()
  })

  createEffect(() => {
    if (!fabricCanvas) return
    const inBrushMode = props.drawing.enabled && props.drawing.mode !== 'move'
    fabricCanvas.isDrawingMode = inBrushMode

    const style = props.drawing.style ?? 'pencil'
    let brush = fabricCanvas.freeDrawingBrush
    const needsNewBrush =
      !brush ||
      (style === 'pencil' && !(brush instanceof PencilBrush)) ||
      (style === 'marker' && !(brush instanceof CircleBrush)) ||
      (style === 'spray' && !(brush instanceof SprayBrush))

    if (needsNewBrush || !brush) {
      if (style === 'marker') {
        brush = new CircleBrush(fabricCanvas)
      } else if (style === 'spray') {
        brush = new SprayBrush(fabricCanvas)
      } else {
        brush = new PencilBrush(fabricCanvas)
        brush.strokeLineCap = 'square'
        brush.strokeLineJoin = 'bevel'
      }
      fabricCanvas.freeDrawingBrush = brush
    }

    brush.color = props.drawing.color
    brush.width = props.drawing.size * RENDER_RATIO
    if (style === 'pencil') {
      brush.strokeLineCap = 'square'
      brush.strokeLineJoin = 'bevel'
    }
  })

  onCleanup(() => {
    fabricCanvas?.dispose()
  })

  function reloadBaseImages(imgSrc: string, maskSrc: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!fabricCanvas) { resolve(); return }
      swappingProduct = true

      const userObjects = fabricCanvas.getObjects().filter(o => !isTshirtLayer(o) && !isBgLayer(o))
      for (const obj of userObjects) {
        const idx = drawingPaths.indexOf(obj)
        if (idx >= 0) drawingPaths.splice(idx, 1)
        fabricCanvas.remove(obj)
      }

      if (tshirtBase) fabricCanvas.remove(tshirtBase)
      tshirtBase = undefined

      const parent = canvasEl?.parentElement
      const logicalWidth = parent?.clientWidth || 300
      const logicalHeight = parent?.clientHeight || 375
      const width = logicalWidth * RENDER_RATIO
      const height = logicalHeight * RENDER_RATIO

      fabricCanvas.setDimensions(
        { width: logicalWidth, height: logicalHeight },
        { cssOnly: true }
      )

      const baseImg = new Image()
      baseImg.onload = () => {
        if (!fabricCanvas) { resolve(); return }

        const maskImg = new Image()
        maskImg.onload = () => {
          if (!fabricCanvas) { resolve(); return }

          const naturalW = baseImg.naturalWidth || maskImg.naturalWidth || 1024
          const naturalH = baseImg.naturalHeight || maskImg.naturalHeight || 1024
          const scale = Math.min(logicalWidth / naturalW, logicalHeight / naturalH) * 0.52 * RENDER_RATIO

          const tmpCanvas = document.createElement('canvas')
          tmpCanvas.width = naturalW
          tmpCanvas.height = naturalH
          const ctx = tmpCanvas.getContext('2d')!
          ctx.drawImage(baseImg, 0, 0, naturalW, naturalH)
          ctx.globalCompositeOperation = 'destination-in'
          ctx.drawImage(maskImg, 0, 0, naturalW, naturalH)
          ctx.globalCompositeOperation = 'source-over'

          tshirtBase = new FabricImage(tmpCanvas, {
            scaleX: scale, scaleY: scale,
            left: width / 2, top: height / 2,
            originX: 'center', originY: 'center',
            selectable: false, evented: false, objectCaching: false,
            excludeFromExport: true
          })
          ;(tshirtBase as any).data = { kind: TSHIRT_LAYER_KEY }
          fabricCanvas.add(tshirtBase)

          colorFilter = new filters.BlendColor({
            color: props.tshirtColor,
            mode: 'multiply',
            alpha: 1
          })
          tshirtBase.filters = [colorFilter]
          tshirtBase.applyFilters()

          fabricCanvas.renderAll()
          swappingProduct = false
          resolve()
        }
        maskImg.onerror = () => {
          console.error('Failed to load mask:', maskSrc)
          fabricCanvas?.renderAll()
          swappingProduct = false
          resolve()
        }
        maskImg.src = maskSrc
      }
      baseImg.onerror = () => {
        console.error('Failed to load front image:', imgSrc)
        if (imgSrc === '/tshirt.png') {
          swappingProduct = false
          resolve()
          return
        }
        loadedImgSrc = '/tshirt.png'
        loadedMaskSrc = '/tshirt-mask.png'
        reloadBaseImages('/tshirt.png', '/tshirt-mask.png').then(resolve)
      }
      baseImg.src = imgSrc
    })
  }

  function buildAPI(): CanvasAPI {
    return {
      addText: (opts) => {
        if (!fabricCanvas) return
        const w = fabricCanvas.getWidth()
        const itext = new IText(opts.text || '文字', {
          left: w / 2,
          top: fabricCanvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          fontFamily: opts.font || 'Manrope',
          fontSize: (opts.size || 32) * RENDER_RATIO,
          fontWeight: opts.bold ? 'bold' : 'normal',
          fontStyle: opts.italic ? 'italic' : 'normal',
          fill: opts.color || DEFAULT_CANVAS_INK,
          charSpacing: Math.round((opts.letterSpacing || 0) * 1000),
          objectCaching: false
        })
        ;(itext as any).data = { kind: 'text' }
        fabricCanvas.add(itext)
        fabricCanvas.setActiveObject(itext)
        fabricCanvas.renderAll()
        fireChange()
      },
      addImage: async (opts) => {
        if (!fabricCanvas) return
        const logicalW = fabricCanvas.getWidth() / RENDER_RATIO
        const logicalH = fabricCanvas.getHeight() / RENDER_RATIO
        const maxW = (opts.maxWidth ?? logicalW * 0.5) * RENDER_RATIO
        const maxH = (opts.maxHeight ?? logicalH * 0.5) * RENDER_RATIO
        const img = new Image()
        if (!opts.url.startsWith('data:')) img.crossOrigin = 'anonymous'
        img.src = opts.url
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Image load failed'))
        })
        let source: HTMLImageElement | HTMLCanvasElement = img
        if (opts.url.startsWith('data:image/svg+xml')) {
          const c = document.createElement('canvas')
          c.width = img.naturalWidth || 100
          c.height = img.naturalHeight || 100
          const cx = c.getContext('2d')
          cx?.drawImage(img, 0, 0)
          source = c
        }
        const fabricImg = new FabricImage(source, {
          left: fabricCanvas.getWidth() / 2,
          top: fabricCanvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          objectCaching: false
        })
        const scale = Math.min(maxW / (fabricImg.width || 1), maxH / (fabricImg.height || 1), 1)
        fabricImg.set({ scaleX: scale, scaleY: scale })
        ;(fabricImg as any).data = { kind: 'image' }
        fabricCanvas.add(fabricImg)
        fabricCanvas.setActiveObject(fabricImg)
        fabricCanvas.renderAll()
        fireChange()
      },
      removeSelected: () => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObjects()
        for (const obj of active) {
          if (isTshirtLayer(obj)) continue
          const idx = drawingPaths.indexOf(obj)
          if (idx >= 0) drawingPaths.splice(idx, 1)
          fabricCanvas.remove(obj)
        }
        fabricCanvas.discardActiveObject()
        fabricCanvas.renderAll()
        fireChange()
      },
      undo: () => {
        if (!fabricCanvas || drawingPaths.length === 0) return
        const last = drawingPaths.pop()
        if (last) fabricCanvas.remove(last)
        fabricCanvas.renderAll()
        fireChange()
      },
      clearDrawing: () => {
        if (!fabricCanvas) return
        for (const p of drawingPaths) fabricCanvas.remove(p)
        drawingPaths.length = 0
        fabricCanvas.renderAll()
        fireChange()
      },
      toJSON: () => {
        if (!fabricCanvas) return null
        return fabricCanvas.toObject(['data'])
      },
      getInternalWidth: () => {
        if (!fabricCanvas) return 0
        return fabricCanvas.getWidth()
      },
      toDataURL: (opts) => {
        if (!fabricCanvas) return ''
        const multiplier = opts?.width
          ? opts.width / fabricCanvas.getWidth()
          : 1
        return fabricCanvas.toDataURL({
          format: opts?.format ?? 'png',
          multiplier
        })
      },
      loadJSON: async (json: any, scale = 1) => {
        if (!fabricCanvas) return
        if (!json || typeof json !== 'object') return
        swappingProduct = true
        try {
        // 清掉画布上既有的用户对象（保留 whiteBg / tshirtBase 底层不动）
        const toRemove = fabricCanvas.getObjects().filter(o => !isTshirtLayer(o) && !isBgLayer(o))
        for (const o of toRemove) {
          if (drawingPaths.includes(o)) {
            const i = drawingPaths.indexOf(o)
            if (i >= 0) drawingPaths.splice(i, 1)
          }
          fabricCanvas.remove(o)
        }
        const objects = Array.isArray(json.objects) ? json.objects : []
        // 过滤掉保存进来的 tshirt 底图：
        //  - 新数据：data.kind === 'tshirt'（toJSON(['data']) 持久化了 data）
        //  - 旧数据：无 data 时不再用 selectable/evented 兜底——
        //    fabric toObject 默认不序列化这两个字段，会把贴纸等 Image 对象误判为底图。
        //    无 data 的 Image 统一交由下方 reviver 补打 kind:'image' 后正常加载。
        const isSavedTshirt = (o: any) => o?.data?.kind === TSHIRT_LAYER_KEY
        const userObjects = objects.filter((o: any) => !isSavedTshirt(o))
        if (userObjects.length === 0) {
          fabricCanvas.renderAll()
          ensureTextOnTop()
          return
        }
        // 手动 enliven，避免 fabric.loadFromJSON 内部 clear() 清掉底层 + 混入 JSON 里的 tshirt
        const enlived: any[] = await util.enlivenObjects(userObjects, {
          reviver: (serialized: any, instance: any) => {
            if (serialized?.data?.kind) {
              instance.data = serialized.data
            } else {
              const t = serialized?.type
              let kind: string | null = null
              if (t === 'IText' || t === 'i-text' || t === 'Text' || t === 'Textbox') kind = 'text'
              else if (t === 'Image') kind = 'image'
              else if (t === 'Path') kind = DRAWING_LAYER_KEY
              if (kind) instance.data = { kind }
            }
          }
        })
        for (const obj of enlived) {
          if (scale !== 1) {
            const updates: Record<string, any> = {
              left: (obj.left || 0) * scale,
              top: (obj.top || 0) * scale,
              scaleX: (obj.scaleX || 1) * scale,
              scaleY: (obj.scaleY || 1) * scale
            }
            const fontSize = (obj as any).fontSize
            if (fontSize) updates.fontSize = fontSize * scale
            obj.set(updates)
          }
          fabricCanvas.add(obj)
        }
        fabricCanvas.renderAll()
        ensureTextOnTop()
        } finally {
          swappingProduct = false
        }
        fireChange()
      },
      isEmpty: () => {
        if (!fabricCanvas) return true
        return fabricCanvas.getObjects().filter(o => !isTshirtLayer(o)).length === 0
      },
      hasActiveObject: () => {
        if (!fabricCanvas) return false
        const active = fabricCanvas.getActiveObject()
        return active !== undefined && active !== null && !isTshirtLayer(active as FabricObject)
      },
      getDrawingCount: () => drawingPaths.length,
      getSelectedText: () => {
        if (!fabricCanvas) return null
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return null
        const t = active as IText
        return {
          text: t.text || '',
          font: t.fontFamily || 'Manrope',
          color: (t.fill as string) || DEFAULT_CANVAS_INK,
          size: (t.fontSize || 32) / RENDER_RATIO,
          letterSpacing: (t.charSpacing || 0) / 1000,
          bold: t.fontWeight === 'bold' || false,
          italic: t.fontStyle === 'italic' || false
        }
      },
      updateText: (opts) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        t.set({
          text: opts.text || '文字',
          fontFamily: opts.font || 'Manrope',
          fill: opts.color || DEFAULT_CANVAS_INK,
          fontSize: (opts.size || 32) * RENDER_RATIO,
          fontWeight: opts.bold ? 'bold' : 'normal',
          fontStyle: opts.italic ? 'italic' : 'normal',
          charSpacing: Math.round((opts.letterSpacing || 0) * 1000)
        })
        t.initDimensions()
        t.setCoords()
        t.dirty = true
        fabricCanvas.renderAll()
        fireChange()
      },
      setTextColor: (hex) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        t.set({ fill: hex })
        t.dirty = true
        t.setCoords()
        fabricCanvas.renderAll()
        fireChange()
      },
      setTextFont: (font) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        t.set({ fontFamily: font })
        t.initDimensions()
        t.setCoords()
        t.dirty = true
        fabricCanvas.renderAll()
        fireChange()
      },
      setTextSize: (delta) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        const newSize = Math.max(12, Math.min(120, (t.fontSize || 32) + delta * RENDER_RATIO))
        t.set({ fontSize: newSize })
        t.initDimensions()
        t.setCoords()
        t.dirty = true
        fabricCanvas.renderAll()
        fireChange()
      },
      setTextBold: (bold) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        t.set({ fontWeight: bold ? 'bold' : 'normal' })
        t.initDimensions()
        t.setCoords()
        t.dirty = true
        fabricCanvas.renderAll()
        fireChange()
      },
      setTextItalic: (italic) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        t.set({ fontStyle: italic ? 'italic' : 'normal' })
        t.initDimensions()
        t.setCoords()
        t.dirty = true
        fabricCanvas.renderAll()
        fireChange()
      },
      setTextLetterSpacing: (delta) => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || (active as any).data?.kind !== 'text') return
        const t = active as IText
        const current = (t.charSpacing || 0) / 1000
        const newSpacing = Math.max(0, Math.min(0.5, current + delta))
        t.set({ charSpacing: Math.round(newSpacing * 1000) })
        t.initDimensions()
        t.setCoords()
        t.dirty = true
        fabricCanvas.renderAll()
        fireChange()
      },
      bringToFront: () => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || isTshirtLayer(active)) return
        fabricCanvas.bringObjectToFront(active)
        ensureTextOnTop()
        fabricCanvas.renderAll()
        fireChange()
      },
      sendToBack: () => {
        if (!fabricCanvas) return
        const active = fabricCanvas.getActiveObject()
        if (!active || isTshirtLayer(active)) return
        const objects = fabricCanvas.getObjects()
        let lastTshirtIndex = -1
        for (let i = 0; i < objects.length; i++) {
          if ((objects[i] as any).data?.kind === TSHIRT_LAYER_KEY) {
            lastTshirtIndex = i
          }
        }
        fabricCanvas.moveObjectTo(active, lastTshirtIndex >= 0 ? lastTshirtIndex + 1 : 0)
        fabricCanvas.renderAll()
        fireChange()
      },
      reloadImages: async (imgSrc: string, maskSrc?: string) => {
        const src = maskSrc || imgSrc.replace(/\.[^.]+$/, '-mask.png')
        if (imgSrc === loadedImgSrc && src === loadedMaskSrc) {
          return
        }
        loadedImgSrc = imgSrc
        loadedMaskSrc = src
        await reloadBaseImages(imgSrc, src)
      },
      clearDesign: () => {
        if (!fabricCanvas) return
        swappingProduct = true
        try {
          const toRemove = fabricCanvas.getObjects().filter(o => !isTshirtLayer(o) && !isBgLayer(o))
          for (const o of toRemove) {
            const idx = drawingPaths.indexOf(o)
            if (idx >= 0) drawingPaths.splice(idx, 1)
            fabricCanvas.remove(o)
          }
          fabricCanvas.discardActiveObject()
          fabricCanvas.renderAll()
        } finally {
          swappingProduct = false
        }
        fireChange()
      }
    }
  }

  return (
    <canvas
      ref={canvasEl}
      class="w-full h-full"
      role="img"
      aria-label="设计画布"
    />
  )
}
