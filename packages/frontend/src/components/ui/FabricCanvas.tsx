import { onMount, onCleanup, createEffect } from 'solid-js'
import {
  Canvas,
  CircleBrush,
  FabricImage,
  FabricObject,
  IText,
  PencilBrush,
  SprayBrush,
  filters
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
  reloadImages: (imgSrc: string, maskSrc?: string) => void
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
const DRAWING_LAYER_KEY = 'drawing'
const RENDER_RATIO = 2

export default function FabricCanvas(props: Props) {
  let canvasEl: HTMLCanvasElement | undefined
  let fabricCanvas: Canvas | undefined
  let tshirtBase: FabricImage | undefined
  let tshirtMask: FabricImage | undefined
  let colorFilter: filters.BlendColor | undefined
  const drawingPaths: FabricObject[] = []
  const changeListeners: Array<() => void> = []
  let swappingProduct = false
  let loadedImgSrc = ''
  let loadedMaskSrc = ''

  let diagId = 0
  const diag = (msg: string, data?: any) => {
    const id = ++diagId
    if (data) { console.log(`[FC-DIAG:${id}]`, msg, data) }
    else { console.log(`[FC-DIAG:${id}]`, msg) }
  }

  const isTshirtLayer = (obj: FabricObject | undefined) =>
    obj !== undefined && (obj === tshirtBase || obj === tshirtMask)

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
    diag('onMount started', { tshirtImage: props.tshirtImage, maskImage: props.maskImage })
    if (!canvasEl) { diag('onMount: no canvasEl!'); return }
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

    canvasEl.style.width = logicalWidth + 'px'
    canvasEl.style.height = logicalHeight + 'px'
    const wrapper = canvasEl.parentElement
    if (wrapper) {
      wrapper.style.width = logicalWidth + 'px'
      wrapper.style.height = logicalHeight + 'px'
    }

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
    diag('onMount initial images', { initImgSrc, initMaskSrc })

    const baseImg = new Image()
    baseImg.onload = () => {
      diag('onMount baseImg.onload', { src: initImgSrc, nw: baseImg.naturalWidth, nh: baseImg.naturalHeight })
      if (!fabricCanvas) { diag('onMount baseImg.onload: no fabricCanvas!'); return }
      const naturalW = baseImg.naturalWidth || 1024
      const naturalH = baseImg.naturalHeight || 1024
      const scale = Math.min(logicalWidth / naturalW, logicalHeight / naturalH) * 0.52 * RENDER_RATIO

      tshirtBase = new FabricImage(baseImg, {
        scaleX: scale,
        scaleY: scale,
        left: width / 2,
        top: height / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        objectCaching: false
      })
      ;(tshirtBase as any).data = { kind: TSHIRT_LAYER_KEY }
        fabricCanvas.add(tshirtBase)
        diag('onMount tshirtBase added to canvas')

      const maskImg = new Image()
      maskImg.onload = () => {
        diag('onMount maskImg.onload', { src: initMaskSrc, nw: maskImg.naturalWidth, nh: maskImg.naturalHeight })
        if (!fabricCanvas) { diag('onMount maskImg.onload: no fabricCanvas!'); return }
        if (!tshirtBase) { diag('onMount maskImg.onload: no tshirtBase!'); return }
        tshirtMask = new FabricImage(maskImg, {
          scaleX: scale,
          scaleY: scale,
          left: width / 2,
          top: height / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          objectCaching: false,
          globalCompositeOperation: 'multiply'
        })
        ;(tshirtMask as any).data = { kind: TSHIRT_LAYER_KEY }

        colorFilter = new filters.BlendColor({
          color: props.tshirtColor,
          mode: 'multiply',
          alpha: 1
        })
        tshirtMask.filters = [colorFilter]
        tshirtMask.applyFilters()

        fabricCanvas.add(tshirtMask)
        fabricCanvas.renderAll()
        diag('onMount canvas rendered (both images loaded)')
        loadedImgSrc = initImgSrc
        loadedMaskSrc = initMaskSrc
        props.onReady?.(buildAPI())
        diag('onMount onReady called')
      }
      maskImg.onerror = () => {
        console.error('Failed to load tshirt mask:', initMaskSrc)
        diag('onMount maskImg.onerror', { src: initMaskSrc })
        fabricCanvas?.renderAll()
        props.onReady?.(buildAPI())
      }
      maskImg.src = initMaskSrc
      diag('onMount maskImg.src set', { src: initMaskSrc })
    }
    baseImg.onerror = () => {
      diag('onMount baseImg.onerror', { src: initImgSrc })
    }
    baseImg.src = initImgSrc
    diag('onMount baseImg.src set', { src: initImgSrc })
  })

  createEffect(() => {
    const color = props.tshirtColor
    if (!tshirtMask || !fabricCanvas || !colorFilter) return
    colorFilter.color = color
    tshirtMask.applyFilters()
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

  function reloadBaseImages(imgSrc: string, maskSrc: string) {
    diag('reloadBaseImages called', { imgSrc, maskSrc })
    if (!fabricCanvas) { diag('reloadBaseImages: no fabricCanvas!'); return }
    swappingProduct = true

    const userObjects = fabricCanvas.getObjects().filter(o => !isTshirtLayer(o))
    for (const obj of userObjects) {
      const idx = drawingPaths.indexOf(obj)
      if (idx >= 0) drawingPaths.splice(idx, 1)
      fabricCanvas.remove(obj)
    }

    if (tshirtBase) fabricCanvas.remove(tshirtBase)
    if (tshirtMask) fabricCanvas.remove(tshirtMask)
    tshirtBase = undefined
    tshirtMask = undefined

    const parent = canvasEl?.parentElement
    const logicalWidth = parent?.clientWidth || 300
    const logicalHeight = parent?.clientHeight || 375
    const width = logicalWidth * RENDER_RATIO
    const height = logicalHeight * RENDER_RATIO

    if (canvasEl) {
      canvasEl.style.width = logicalWidth + 'px'
      canvasEl.style.height = logicalHeight + 'px'
      const wrapper = canvasEl.parentElement
      if (wrapper) {
        wrapper.style.width = logicalWidth + 'px'
        wrapper.style.height = logicalHeight + 'px'
      }
    }

    const baseImg = new Image()
    baseImg.onload = () => {
      diag('reloadBase baseImg.onload', { src: imgSrc, nw: baseImg.naturalWidth, nh: baseImg.naturalHeight })
      if (!fabricCanvas) { diag('reloadBase baseImg.onload: no fabricCanvas!'); return }
      const naturalW = baseImg.naturalWidth || 1024
      const naturalH = baseImg.naturalHeight || 1024
      const scale = Math.min(logicalWidth / naturalW, logicalHeight / naturalH) * 0.52 * RENDER_RATIO

      tshirtBase = new FabricImage(baseImg, {
        scaleX: scale, scaleY: scale,
        left: width / 2, top: height / 2,
        originX: 'center', originY: 'center',
        selectable: false, evented: false, objectCaching: false
      })
      ;(tshirtBase as any).data = { kind: TSHIRT_LAYER_KEY }
      fabricCanvas.add(tshirtBase)

      const maskImg = new Image()
      maskImg.onload = () => {
        diag('reloadBase maskImg.onload', { src: maskSrc, nw: maskImg.naturalWidth, nh: maskImg.naturalHeight })
        if (!fabricCanvas) { diag('reloadBase maskImg.onload: no fabricCanvas!'); return }
        if (!tshirtBase) { diag('reloadBase maskImg.onload: no tshirtBase!'); return }
        tshirtMask = new FabricImage(maskImg, {
          scaleX: scale, scaleY: scale,
          left: width / 2, top: height / 2,
          originX: 'center', originY: 'center',
          selectable: false, evented: false, objectCaching: false,
          globalCompositeOperation: 'multiply'
        })
        ;(tshirtMask as any).data = { kind: TSHIRT_LAYER_KEY }

        colorFilter = new filters.BlendColor({
          color: props.tshirtColor,
          mode: 'multiply',
          alpha: 1
        })
        tshirtMask.filters = [colorFilter]
        tshirtMask.applyFilters()

        fabricCanvas.add(tshirtMask)
        fabricCanvas.renderAll()
        diag('reloadBase canvas rendered')
        swappingProduct = false
      }
      maskImg.onerror = () => {
        console.error('Failed to load mask:', maskSrc)
        diag('reloadBase maskImg.onerror', { src: maskSrc })
        fabricCanvas?.renderAll()
        swappingProduct = false
      }
      maskImg.src = maskSrc
      diag('reloadBase maskImg.src set', { src: maskSrc })
    }
    baseImg.onerror = () => {
      console.error('Failed to load front image:', imgSrc)
      diag('reloadBase baseImg.onerror', { src: imgSrc })
      if (imgSrc === '/tshirt.png') {
        swappingProduct = false
        return
      }
      loadedImgSrc = '/tshirt.png'
      loadedMaskSrc = '/tshirt-mask.png'
      diag('reloadBase: falling back to fallback images')
      reloadBaseImages('/tshirt.png', '/tshirt-mask.png')
    }
    baseImg.src = imgSrc
    diag('reloadBase baseImg.src set', { src: imgSrc })
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
        return fabricCanvas.toJSON()
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
        const toRemove = fabricCanvas.getObjects().filter(o => !isTshirtLayer(o))
        for (const o of toRemove) {
          if (drawingPaths.includes(o)) {
            const i = drawingPaths.indexOf(o)
            if (i >= 0) drawingPaths.splice(i, 1)
          }
          fabricCanvas.remove(o)
        }
        const objects = Array.isArray(json.objects) ? json.objects : []
        const userObjects = objects.filter((o: any) => o?.data?.kind !== TSHIRT_LAYER_KEY)
        const filtered = { ...json, objects: userObjects, background: '#ffffff' }
        await fabricCanvas.loadFromJSON(filtered)
        if (scale !== 1) {
          const loaded = fabricCanvas.getObjects().filter(o => !isTshirtLayer(o))
          for (const obj of loaded) {
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
        }
        fabricCanvas.renderAll()
        ensureTextOnTop()
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
      reloadImages: (imgSrc: string, maskSrc?: string) => {
        const src = maskSrc || imgSrc.replace(/\.[^.]+$/, '-mask.png')
        diag('reloadImages called', { imgSrc, maskSrc, src, loadedImgSrc, loadedMaskSrc })
        if (imgSrc === loadedImgSrc && src === loadedMaskSrc) {
          diag('reloadImages: same URLs, skipping')
          return
        }
        loadedImgSrc = imgSrc
        loadedMaskSrc = src
        reloadBaseImages(imgSrc, src)
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
