import { createSignal, For, Show, onMount } from 'solid-js'
import { api, type UploadItem } from '../../../../lib/api'
import { showToast } from '../../../../lib/toast'

interface Props {
  onAddImage: (opts: { url: string; maxWidth?: number; maxHeight?: number }) => void
}

const SYSTEM_STICKERS = [
  { name: '爱心', url: '/stickers/heart.svg' },
  { name: '星星', url: '/stickers/star.svg' },
  { name: '笑脸', url: '/stickers/smile.svg' },
  { name: '闪电', url: '/stickers/lightning.svg' }
]

export default function AssetsPanel(props: Props) {
  const [uploads, setUploads] = createSignal<UploadItem[]>([])
  const [loading, setLoading] = createSignal(false)
  const [uploading, setUploading] = createSignal(false)
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

  return (
    <div class="py-6 space-y-6">
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-headline text-on-surface">系统贴纸</h2>
          <span class="text-xs text-secondary">{SYSTEM_STICKERS.length} 项</span>
        </div>
        <div class="grid grid-cols-4 gap-3">
          <For each={SYSTEM_STICKERS}>
            {(sticker) => (
              <button
                class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-all p-2"
                onClick={() => props.onAddImage({ url: sticker.url, maxWidth: 40, maxHeight: 40 })}
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
            <div class="grid grid-cols-3 gap-3">
              <For each={uploads()}>
                {(item) => (
                  <button
                    class="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant hover:border-primary hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={() => addToCanvas(item)}
                    title={item.originalName}
                  >
                    <img
                      class="w-full h-full object-contain"
                      src={item.thumbUrl}
                      alt={item.originalName}
                      loading="lazy"
                    />
                  </button>
                )}
              </For>
            </div>
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
