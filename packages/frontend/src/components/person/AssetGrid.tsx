import { createSignal, For, onMount, Show } from 'solid-js'
import { api, type UploadItem } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function AssetGrid() {
  const [items, setItems] = createSignal<UploadItem[]>([])
  const [loading, setLoading] = createSignal(true)
  const [search, setSearch] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  let fileInput: HTMLInputElement | undefined

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.uploads.list({ limit: 50 })
      setItems(res.data.items)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    load()
  })

  const handleUpload = async (e: Event) => {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    try {
      await api.uploads.create(file)
      await load()
      showToast('已上传')
    } catch (err: any) {
      showToast(err.message || '上传失败')
    } finally {
      target.value = ''
    }
  }

  const remove = async (id: number) => {
    if (!confirm('确定删除此素材？')) return
    try {
      await api.uploads.remove(id)
      setItems(items().filter(i => i.id !== id))
      showToast('已删除')
    } catch (err: any) {
      showToast(err.message || '删除失败')
    }
  }

  const filtered = () => {
    const q = search().toLowerCase()
    if (!q) return items()
    return items().filter(i => i.originalName.toLowerCase().includes(q))
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface" style="font-family: 'Manrope', sans-serif">
      <header class="bg-surface/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-4 h-16 border-b border-outline-variant">
        <a href="/person" class="p-2 hover:bg-surface-container rounded-full transition-colors" aria-label="返回">
          <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </a>
        <h1 class="text-lg font-bold text-primary">个人素材库</h1>
        <button
          class="p-2 hover:bg-surface-container rounded-full transition-colors"
          onClick={() => fileInput?.click()}
          aria-label="上传"
        >
          <span class="material-symbols-outlined text-primary">cloud_upload</span>
        </button>
      </header>

      <main class="px-4 pt-4 pb-24 space-y-4 max-w-md mx-auto">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            class="w-full bg-white border border-outline-variant rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
            placeholder="查找素材名称..."
            type="text"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        <Show when={!loading()} fallback={
          <div class="text-center py-20 text-secondary">
            <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        }>
          <Show when={!error()} fallback={
            <div class="text-center py-20">
              <p class="text-sm text-error mb-2">{error()}</p>
              <button
                class="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
                onClick={load}
              >
                重试
              </button>
            </div>
          }>
            <Show when={filtered().length > 0} fallback={
              <div class="text-center py-20 space-y-3">
                <span class="material-symbols-outlined text-outline text-5xl">image</span>
                <p class="text-sm text-on-surface-variant">
                  {search() ? '没有匹配的素材' : '还没有上传过素材'}
                </p>
              </div>
            }>
              <div class="grid grid-cols-2 gap-3">
                <For each={filtered()}>
                  {(item) => (
                    <div class="group relative bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col aspect-[4/5] hover:border-primary transition-all">
                      <div class="flex-1 bg-surface-variant/30 overflow-hidden relative">
                        <img
                          class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          src={item.thumbUrl}
                          alt={item.originalName}
                          loading="lazy"
                        />
                        <button
                          class="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-sm text-on-surface-variant hover:text-error transition-all"
                          onClick={() => remove(item.id)}
                          aria-label="删除"
                        >
                          <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                      <div class="p-3">
                        <p class="font-semibold text-sm text-on-surface truncate">{item.originalName}</p>
                        <p class="text-[10px] text-outline mt-1 uppercase tracking-wider font-bold">
                          {item.width}×{item.height}
                        </p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </Show>
      </main>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
