import { createSignal, For, onMount, Show } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import SkeletonCard from '../ui/SkeletonCard'
import ConfirmDialog from '../ui/ConfirmDialog'
import { api, type UploadItem } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function AssetGrid() {
  const [items, setItems] = createSignal<UploadItem[]>([])
  const [loading, setLoading] = createSignal(true)
  const [search, setSearch] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false)
  const [pendingDeleteId, setPendingDeleteId] = createSignal<number | null>(null)
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

  const requestDelete = (id: number) => {
    setPendingDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    const id = pendingDeleteId()
    if (id === null) return
    setShowDeleteConfirm(false)
    setPendingDeleteId(null)
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
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface h-16 flex justify-between items-center px-4 border-b border-outline-variant">
        <a href="/person" class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full" aria-label="返回">
          <span class="material-symbols-outlined text-primary">arrow_back</span>
        </a>
        <h1 class="text-lg font-bold text-primary">个人素材库</h1>
        <button
          type="button"
          class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
          onClick={() => fileInput?.click()}
          aria-label="上传"
        >
          <span class="material-symbols-outlined text-primary">cloud_upload</span>
        </button>
      </header>

      <main class="pt-4 pb-24 space-y-4 container-content">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            class="w-full bg-surface border border-outline-variant rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-on-surface-variant"
            placeholder="查找素材名称..."
            type="text"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        <Show when={!loading()} fallback={
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <For each={[1, 2, 3, 4, 5, 6]}>
              {() => <SkeletonCard />}
            </For>
          </div>
        }>
          <Show when={!error()} fallback={
            <div class="text-center py-20">
              <p class="text-sm text-error mb-2">{error()}</p>
              <button
                type="button"
                class="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm tap-target"
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
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <For each={filtered()}>
                  {(item) => (
                    <div class="group relative bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col aspect-[4/5] hover:border-primary transition-colors transition-transform hover:-translate-y-0.5 duration-200">
                      <div class="flex-1 bg-surface-variant/30 overflow-hidden relative">
                        <ProductImage
                          src={item.thumbUrl}
                          alt={item.originalName}
                          aspect="aspect-[4/5]"
                          rounded="rounded-none"
                          fallbackLabel={item.originalName}
                          objectFit="contain"
                          class="p-2 group-hover:opacity-90 transition-opacity duration-300"
                        />
                        <button
                          type="button"
                          class="absolute top-2 right-2 bg-surface/90 backdrop-blur-md p-2 rounded-lg text-on-surface-variant hover:text-error transition-colors tap-target"
                          onClick={() => requestDelete(item.id)}
                          aria-label="删除"
                        >
                          <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                      <div class="p-3">
                        <p class="font-semibold text-sm text-on-surface truncate">{item.originalName}</p>
                        <p class="text-label-md text-outline mt-1">
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

      <ConfirmDialog
        open={showDeleteConfirm()}
        title="确认删除"
        message="确定删除此素材？"
        confirmText="删除"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setPendingDeleteId(null) }}
      />

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
