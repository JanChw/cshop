import { createSignal, For, Show, onMount } from 'solid-js'
import ProductImage from '../../../ui/ProductImage'
import { api, type StickerItem, type UserStickerItem } from '../../../../lib/api'
import { showToast } from '../../../../lib/toast'

interface Props {
  onAddImage: (opts: { url: string; maxWidth?: number; maxHeight?: number }) => void
}

export default function AssetsPanel(props: Props) {
  const [stickers, setStickers] = createSignal<StickerItem[]>([])
  const [stickerLoading, setStickerLoading] = createSignal(true)
  const [assets, setAssets] = createSignal<UserStickerItem[]>([])
  const [assetsLoading, setAssetsLoading] = createSignal(false)
  const [uploading, setUploading] = createSignal(false)
  const [dragOver, setDragOver] = createSignal(false)
  const [showAllUploads, setShowAllUploads] = createSignal(false)
  const [pickerMode, setPickerMode] = createSignal(false)
  const [pickerCategory, setPickerCategory] = createSignal('all')
  const [pickerSearch, setPickerSearch] = createSignal('')
  const [pickerPage, setPickerPage] = createSignal(1)
  const [pickerTotalPages, setPickerTotalPages] = createSignal(0)
  const [pickerLoading, setPickerLoading] = createSignal(false)
  const [pickerStickers, setPickerStickers] = createSignal<StickerItem[]>([])
  const PICKER_LIMIT = 20
  let fileInput: HTMLInputElement | undefined

  const loadStickers = async () => {
    setStickerLoading(true)
    try {
      const res = await api.stickers.list()
      setStickers(res.data.items)
    } catch (err) {
      console.error('Failed to load stickers', err)
    } finally {
      setStickerLoading(false)
    }
  }

  const loadPickerStickers = async (pageNum?: number) => {
    setPickerLoading(true)
    try {
      const p = pageNum ?? pickerPage()
      const res = await api.stickers.list({
        category: pickerCategory() === 'all' ? undefined : pickerCategory(),
        q: pickerSearch() || undefined,
        page: p,
        limit: PICKER_LIMIT
      })
      setPickerStickers(res.data.items)
      setPickerTotalPages(res.data.totalPages)
      setPickerPage(p)
    } catch (err) {
      console.error('Failed to load stickers', err)
    } finally {
      setPickerLoading(false)
    }
  }

  const loadAssets = async () => {
    setAssetsLoading(true)
    try {
      const res = await api.userStickers.list()
      setAssets(res.data.items)
    } catch (err) {
      console.error('Failed to load user assets', err)
    } finally {
      setAssetsLoading(false)
    }
  }

  onMount(() => {
    loadStickers()
    loadAssets()
  })

  const categories = () => {
    const catSet = new Set<string>()
    stickers().forEach(s => catSet.add(s.category))
    return Array.from(catSet)
  }

  const categoryLabel = (key: string) => {
    const labels: Record<string, string> = {
      recommend: '推荐',
      geometric: '几何',
      nature: '自然',
      abstract: '抽象',
      general: '通用'
    }
    return labels[key] || key
  }

  const inlineItems = () => stickers().filter(s => s.category === 'recommend')

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const name = file.name.replace(/\.[^/.]+$/, '')
      const res = await api.userStickers.create(file, name)
      await loadAssets()
      props.onAddImage({
        url: res.data.url,
        maxWidth: 320,
        maxHeight: 320
      })
      showToast('已添加到设计')
    } catch (err: any) {
      showToast(err.message || '上传失败')
    } finally {
      setUploading(false)
      if (fileInput) fileInput.value = ''
    }
  }

  const onFileChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (file) handleFile(file)
  }

  const addToCanvas = (item: UserStickerItem) => {
    props.onAddImage({
      url: item.url,
      maxWidth: 320,
      maxHeight: 320
    })
    showToast('已添加到设计')
  }

  const openPicker = () => {
    setPickerCategory('all')
    setPickerSearch('')
    setPickerPage(1)
    setPickerMode(true)
    queueMicrotask(() => loadPickerStickers(1))
  }

  const closePicker = () => {
    setPickerMode(false)
  }

  const onPickerCategoryClick = (cat: string) => {
    setPickerCategory(cat)
    setPickerPage(1)
    queueMicrotask(() => loadPickerStickers(1))
  }

  const onPickerSearch = (value: string) => {
    setPickerSearch(value)
    setPickerPage(1)
    queueMicrotask(() => loadPickerStickers(1))
  }

  const onPickerPage = (p: number) => {
    if (p < 1 || p > pickerTotalPages()) return
    setPickerPage(p)
    queueMicrotask(() => loadPickerStickers(p))
  }

  const onStickerSelect = (sticker: StickerItem) => {
    props.onAddImage({ url: sticker.url, maxWidth: 60, maxHeight: 60 })
    showToast('已添加到设计')
  }

  return (
    <div class="space-y-5">
      <Show
        when={!pickerMode()}
        fallback={
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <button
                class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors -ml-1"
                onClick={closePicker}
                aria-label="返回"
              >
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
              </button>
              <h2 class="text-lg font-headline font-bold text-on-surface">系统贴纸</h2>
            </div>

            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                ref={el => {
                  if (el) queueMicrotask(() => el.focus())
                }}
                type="text"
                placeholder="搜索贴纸..."
                class="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-high text-on-surface text-sm placeholder:text-outline outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={pickerSearch()}
                onInput={(e) => onPickerSearch(e.currentTarget.value)}
              />
            </div>

            <div class="flex overflow-x-auto gap-2 pb-1" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
              <button
                class={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  pickerCategory() === 'all'
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
                }`}
                onClick={() => onPickerCategoryClick('all')}
              >
                全部
              </button>
              <For each={categories()}>
                {(cat) => (
                  <button
                    class={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      pickerCategory() === cat
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
                    }`}
                    onClick={() => onPickerCategoryClick(cat)}
                  >
                    {categoryLabel(cat)}
                  </button>
                )}
              </For>
            </div>

            <Show
              when={!pickerLoading()}
              fallback={
                <div class="flex items-center justify-center py-16 text-secondary">
                  <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                </div>
              }
            >
              <Show
                when={pickerStickers().length > 0}
                fallback={
                  <div class="text-center py-16 text-on-surface-variant">
                    <span class="material-symbols-outlined text-4xl block mb-3 text-outline">search_off</span>
                    <p class="text-sm">未找到匹配的贴纸</p>
                  </div>
                }
              >
                <div class="grid grid-cols-4 gap-3">
                  <For each={pickerStickers()}>
                    {(sticker) => (
                      <button
                        class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-colors transition-transform p-2"
                        onClick={() => onStickerSelect(sticker)}
                        title={sticker.name}
                      >
                        <img
                          class="w-full h-full object-contain"
                          src={sticker.url}
                          alt={sticker.name}
                          loading="lazy"
                        />
                      </button>
                    )}
                  </For>
                </div>

                <Show when={pickerTotalPages() > 1}>
                  <div class="flex items-center justify-center gap-2 mt-5">
                    <button
                      class={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        pickerPage() <= 1
                          ? 'text-outline cursor-default'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                      disabled={pickerPage() <= 1}
                      onClick={() => onPickerPage(pickerPage() - 1)}
                      aria-label="上一页"
                    >
                      <span class="material-symbols-outlined text-lg">chevron_left</span>
                    </button>

                    <For each={getPageNumbers(pickerPage(), pickerTotalPages())}>
                      {(p) => (
                        <>
                          <Show when={typeof p === 'number'}>
                            <button
                              class={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                p === pickerPage()
                                  ? 'bg-primary text-on-primary'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                              onClick={() => onPickerPage(p as number)}
                            >
                              {p}
                            </button>
                          </Show>
                          <Show when={typeof p === 'string'}>
                            <span class="text-outline text-sm px-1">{p}</span>
                          </Show>
                        </>
                      )}
                    </For>

                    <button
                      class={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        pickerPage() >= pickerTotalPages()
                          ? 'text-outline cursor-default'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                      disabled={pickerPage() >= pickerTotalPages()}
                      onClick={() => onPickerPage(pickerPage() + 1)}
                      aria-label="下一页"
                    >
                      <span class="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </Show>
              </Show>
            </Show>
          </div>
        }
      >
        <section>
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-1">
              <h2 class="text-xl font-headline text-on-surface">系统贴纸</h2>
              <Show when={!stickerLoading()}>
                <span class="text-xs text-secondary">({stickers().length} 项)</span>
              </Show>
            </div>
            <button
              class="text-xs font-bold text-primary hover:underline focus:outline-none"
              onClick={openPicker}
            >
              浏览贴纸 ›
            </button>
          </div>

          <Show when={!stickerLoading()} fallback={
            <div class="text-center py-12 text-secondary">
              <span class="material-symbols-outlined animate-spin">progress_activity</span>
            </div>
          }>
            <Show
              when={inlineItems().length > 0}
              fallback={
                <div class="text-center py-12 text-on-surface-variant bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                  <span class="material-symbols-outlined text-outline text-4xl block mb-2">auto_awesome_sticker</span>
                  <p class="text-sm">该分类暂无贴纸</p>
                </div>
              }
            >
              <div class="grid grid-cols-4 gap-3">
                <For each={inlineItems()}>
                  {(sticker) => (
                    <button
                      class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-colors transition-transform p-2"
                      onClick={() => onStickerSelect(sticker)}
                      title={sticker.name}
                    >
                      <img
                        class="w-full h-full object-contain"
                        src={sticker.url}
                        alt={sticker.name}
                        loading="lazy"
                      />
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </section>

        <section>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-headline text-on-surface">我的素材库</h2>
            <Show when={!assetsLoading()}>
              <span class="text-xs text-secondary">{assets().length} 项</span>
            </Show>
          </div>
          <Show
            when={!assetsLoading()}
            fallback={
              <div class="text-center py-12 text-secondary">
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
              </div>
            }
          >
            <Show
              when={assets().length > 0}
              fallback={
                <div class="rounded-lg border-2 border-dashed border-outline-variant p-10 text-center">
                  <span class="material-symbols-outlined text-outline text-3xl block mb-2">image</span>
                  <p class="text-sm text-on-surface-variant">还没有上传过素材</p>
                  <p class="text-xs text-secondary mt-1">上传后将自动出现在这里</p>
                </div>
              }
            >
              <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs text-on-surface-variant">最近上传</span>
                  <Show when={assets().length > 4}>
                    <button
                      class="text-xs font-bold text-primary"
                      onClick={() => setShowAllUploads(v => !v)}
                    >
                      {showAllUploads() ? '收起' : '查看全部'}
                    </button>
                  </Show>
                </div>
                <div class="grid grid-cols-4 gap-3">
                  <For each={showAllUploads() ? assets() : assets().slice(0, 4)}>
                    {(item) => (
                      <button
                        class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-colors transition-transform"
                        onClick={() => addToCanvas(item)}
                        title={item.name}
                      >
                        <ProductImage
                          src={item.url}
                          alt={item.name}
                          aspect="aspect-square"
                          rounded="rounded-none"
                          fallbackLabel={item.name}
                          objectFit="contain"
                          class="w-full h-full p-2"
                        />
                      </button>
                    )}
                  </For>
                </div>
              </div>

              <Show when={showAllUploads()}>
                <div class="grid grid-cols-3 gap-3">
                  <For each={assets()}>
                    {(item) => (
                      <button
                        class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-colors transition-transform"
                        onClick={() => addToCanvas(item)}
                        title={item.name}
                      >
                        <ProductImage
                          src={item.url}
                          alt={item.name}
                          aspect="aspect-square"
                          rounded="rounded-none"
                          fallbackLabel={item.name}
                          objectFit="contain"
                          class="w-full h-full p-2"
                        />
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </Show>
        </section>

        <section>
          <h2 class="text-xl font-headline mb-3 text-on-surface">添加新元素</h2>
          <div
            class={`rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 transition-colors cursor-pointer ${
              dragOver()
                ? 'border-primary bg-primary-container/10'
                : 'bg-surface border-outline-variant hover:border-primary hover:bg-primary-container/5'
            }`}
            onClick={() => fileInput?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer?.files?.[0]
              if (file) handleFile(file)
            }}
          >
            <Show
              when={!uploading()}
              fallback={
                <>
                  <span class="material-symbols-outlined text-primary text-3xl mb-2 animate-spin">
                    progress_activity
                  </span>
                  <p class="text-sm font-bold text-on-surface">上传中...</p>
                </>
              }
            >
              <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <p class="text-sm font-bold text-on-surface">上传素材</p>
              <p class="text-xs text-on-surface-variant">
                支持格式: JPG, PNG, WebP（最大 10MB）
              </p>
              <button
                type="button"
                class="mt-2 px-5 py-1.5 bg-primary text-on-primary rounded-lg font-bold text-xs hover:brightness-110 active:scale-95 transition-colors transition-transform"
              >
                浏览文件
              </button>
            </Show>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            onChange={onFileChange}
          />
        </section>

        <div class="bg-tertiary-container text-on-tertiary-container rounded-lg p-4 flex gap-3 items-start">
          <span class="material-symbols-outlined text-tertiary shrink-0">lightbulb</span>
          <p class="text-xs leading-relaxed">
            为了在预览中获得最佳效果，建议上传透明背景的 PNG 图片。
          </p>
        </div>
      </Show>
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | string)[] = []
  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return pages
}
