import { createSignal, For, Show, onMount } from 'solid-js'
import ProductImage from '../../../ui/ProductImage'
import { api, type UploadItem } from '../../../../lib/api'
import { showToast } from '../../../../lib/toast'

interface Props {
  onAddImage: (opts: { url: string; maxWidth?: number; maxHeight?: number }) => void
}

const svgUrl = (content: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${content}</svg>`)}`

const STICKER_CATEGORIES = [
  { key: 'recommend', label: '推荐' },
  { key: 'geometric', label: '几何' },
  { key: 'nature', label: '自然' },
  { key: 'abstract', label: '抽象' }
] as const

type CategoryKey = typeof STICKER_CATEGORIES[number]['key']

const SYSTEM_STICKERS: { name: string; category: CategoryKey; url: string }[] = [
  // recommend
  { name: '爱心', category: 'recommend', url: svgUrl('<path d="M50 85 C20 60 5 45 5 28 C5 15 15 5 28 5 C38 5 46 12 50 20 C54 12 62 5 72 5 C85 5 95 15 95 28 C95 45 80 60 50 85 Z" fill="#c2652a"/>') },
  { name: '星星', category: 'recommend', url: svgUrl('<polygon points="50 5 61 35 95 35 68 55 79 85 50 65 21 85 32 55 5 35 39 35" fill="#c2652a"/>') },
  { name: '笑脸', category: 'recommend', url: svgUrl('<circle cx="50" cy="50" r="45" fill="none" stroke="#c2652a" stroke-width="6"/><circle cx="34" cy="40" r="5" fill="#c2652a"/><circle cx="66" cy="40" r="5" fill="#c2652a"/><path d="M30 60 Q50 78 70 60" fill="none" stroke="#c2652a" stroke-width="6" stroke-linecap="round"/>') },
  { name: '闪电', category: 'recommend', url: svgUrl('<polygon points="55 5 25 50 45 50 35 95 75 45 55 45" fill="#c2652a"/>') },
  // geometric
  { name: '圆形', category: 'geometric', url: svgUrl('<circle cx="50" cy="50" r="40" fill="none" stroke="#3a302a" stroke-width="6"/>') },
  { name: '方形', category: 'geometric', url: svgUrl('<rect x="15" y="15" width="70" height="70" rx="6" fill="none" stroke="#3a302a" stroke-width="6"/>') },
  { name: '三角', category: 'geometric', url: svgUrl('<polygon points="50 15 85 80 15 80" fill="none" stroke="#3a302a" stroke-width="6" stroke-linejoin="round"/>') },
  { name: '六边', category: 'geometric', url: svgUrl('<polygon points="50 10 85 30 85 70 50 90 15 70 15 30" fill="none" stroke="#3a302a" stroke-width="6" stroke-linejoin="round"/>') },
  // nature
  { name: '叶子', category: 'nature', url: svgUrl('<path d="M50 90 Q50 55 20 35 Q50 40 80 35 Q50 55 50 90 Z" fill="#2d4a3e"/><path d="M50 55 L50 80" stroke="#faf5ee" stroke-width="3" stroke-linecap="round"/>') },
  { name: '花朵', category: 'nature', url: svgUrl('<circle cx="50" cy="50" r="10" fill="#c2652a"/><circle cx="50" cy="25" r="12" fill="#e08850"/><circle cx="75" cy="50" r="12" fill="#e08850"/><circle cx="50" cy="75" r="12" fill="#e08850"/><circle cx="25" cy="50" r="12" fill="#e08850"/>') },
  { name: '太阳', category: 'nature', url: svgUrl('<circle cx="50" cy="50" r="18" fill="#c2652a"/><g stroke="#c2652a" stroke-width="5" stroke-linecap="round"><line x1="50" y1="12" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="88"/><line x1="12" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="88" y2="50"/><line x1="23" y1="23" x2="30" y2="30"/><line x1="77" y1="77" x2="70" y2="70"/><line x1="77" y1="23" x2="70" y2="30"/><line x1="23" y1="77" x2="30" y2="70"/></g>') },
  { name: '月亮', category: 'nature', url: svgUrl('<path d="M55 10 A35 35 0 1 1 55 80 A25 25 0 1 0 55 10 Z" fill="#3a302a"/>') },
  // abstract
  { name: '波浪', category: 'abstract', url: svgUrl('<path d="M10 55 Q25 35 40 55 T70 55 T100 55" fill="none" stroke="#3a302a" stroke-width="6" stroke-linecap="round"/>') },
  { name: '螺旋', category: 'abstract', url: svgUrl('<path d="M55 50 C55 47 47 47 47 55 C47 65 65 65 65 50 C65 35 35 35 35 55 C35 75 75 75 75 50" fill="none" stroke="#c2652a" stroke-width="6" stroke-linecap="round"/>') },
  { name: '墨点', category: 'abstract', url: svgUrl('<path d="M50 15 C75 15 90 35 85 55 C80 75 60 90 45 85 C25 80 10 60 15 40 C20 20 35 15 50 15 Z" fill="#3a302a"/>') }
]

export default function AssetsPanel(props: Props) {
  const [uploads, setUploads] = createSignal<UploadItem[]>([])
  const [loading, setLoading] = createSignal(false)
  const [uploading, setUploading] = createSignal(false)
  const [activeCategory, setActiveCategory] = createSignal<CategoryKey>('recommend')
  const [showAllUploads, setShowAllUploads] = createSignal(false)
  let fileInput: HTMLInputElement | undefined

  const loadUploads = async () => {
    setLoading(true)
    try {
      const res = await api.uploads.list({ limit: 20 })
      setUploads(res.data.items)
    } catch (err) {
      console.error('Failed to load uploads', err)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadUploads()
  })

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const res = await api.uploads.create(file)
      await loadUploads()
      props.onAddImage({
        url: `/api/v1/uploads/${res.data.variants.medium.url.split('/').pop()}`,
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

  const addToCanvas = (item: UploadItem) => {
    const url = item.mediumUrl || item.smallUrl || item.thumbUrl
    props.onAddImage({
      url,
      maxWidth: 320,
      maxHeight: 320
    })
    showToast('已添加到设计')
  }

  const filteredStickers = () => SYSTEM_STICKERS.filter(s => s.category === activeCategory())

  return (
    <div class="py-6 space-y-6">
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-headline text-on-surface">系统贴纸</h2>
          <span class="text-xs text-secondary">{SYSTEM_STICKERS.length} 项</span>
        </div>

        <div class="flex overflow-x-auto gap-2 pb-3 mb-2" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
          <For each={STICKER_CATEGORIES}>
            {(cat) => (
              <button
                class={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeCategory() === cat.key
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/60'
                }`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            )}
          </For>
        </div>

        <div class="grid grid-cols-4 gap-3">
          <For each={filteredStickers()}>
            {(sticker) => (
              <button
                class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-all p-2"
                onClick={() => props.onAddImage({ url: sticker.url, maxWidth: 120, maxHeight: 120 })}
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
      </section>

      <section>
        <h2 class="text-2xl font-headline mb-4 text-on-surface">添加新元素</h2>
        <div
          class="rounded-lg bg-surface border-2 border-dashed border-outline-variant flex flex-col items-center justify-center p-10 transition-all cursor-pointer group hover:border-primary hover:bg-primary-container/5"
          onClick={() => fileInput?.click()}
        >
          <Show
            when={!uploading()}
            fallback={
              <>
                <span class="material-symbols-outlined text-primary text-4xl mb-3 animate-spin">
                  progress_activity
                </span>
                <p class="text-base font-bold text-on-surface">上传中...</p>
              </>
            }
          >
            <div class="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <p class="text-base font-bold text-on-surface">上传素材</p>
            <p class="text-xs text-on-surface-variant mt-1">
              支持格式: JPG, PNG, WebP（最大 10MB）
            </p>
            <button
              type="button"
              class="mt-4 px-6 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
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

      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-headline text-on-surface">我的素材库</h2>
          <span class="text-xs text-secondary">{uploads().length} 项</span>
        </div>
        <Show
          when={!loading()}
          fallback={
            <div class="text-center py-12 text-secondary">
              <span class="material-symbols-outlined animate-spin">progress_activity</span>
            </div>
          }
        >
          <Show
            when={uploads().length > 0}
            fallback={
              <div class="rounded-lg border-2 border-dashed border-outline-variant p-10 text-center">
                <span class="material-symbols-outlined text-outline text-3xl block mb-2">image</span>
                <p class="text-sm text-on-surface-variant">还没有上传过素材</p>
                <p class="text-xs text-secondary mt-1">上传后将自动出现在这里</p>
              </div>
            }
          >
            <Show when={uploads().length > 0}>
              <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs text-on-surface-variant">最近上传</span>
                  <Show when={uploads().length > 4}>
                    <button
                      class="text-xs font-bold text-primary"
                      onClick={() => setShowAllUploads(v => !v)}
                    >
                      {showAllUploads() ? '收起' : '查看全部'}
                    </button>
                  </Show>
                </div>
                <div class="grid grid-cols-4 gap-3">
                  <For each={showAllUploads() ? uploads() : uploads().slice(0, 4)}>
                    {(item) => (
                      <button
                        class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-all"
                        onClick={() => addToCanvas(item)}
                        title={item.originalName}
                      >
                        <ProductImage
                          src={item.thumbUrl}
                          alt={item.originalName}
                          aspect="aspect-square"
                          rounded="rounded-none"
                          fallbackLabel={item.originalName}
                          objectFit="contain"
                          class="w-full h-full p-2"
                        />
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <Show when={showAllUploads()}>
              <div class="grid grid-cols-3 gap-3">
                <For each={uploads()}>
                  {(item) => (
                    <button
                      class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-all"
                      onClick={() => addToCanvas(item)}
                      title={item.originalName}
                    >
                      <ProductImage
                        src={item.thumbUrl}
                        alt={item.originalName}
                        aspect="aspect-square"
                        rounded="rounded-none"
                        fallbackLabel={item.originalName}
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

      <div class="bg-tertiary-container text-on-tertiary-container rounded-lg p-4 flex gap-3 items-start">
        <span class="material-symbols-outlined text-tertiary shrink-0">lightbulb</span>
        <p class="text-xs leading-relaxed">
          为了在预览中获得最佳效果，建议上传透明背景的 PNG 图片。
        </p>
      </div>
    </div>
  )
}
