import { createSignal, For, onMount, Show } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import SkeletonCard from '../ui/SkeletonCard'
import ConfirmDialog from '../ui/ConfirmDialog'
import LoadMore from '../ui/LoadMore'
import { api, type UserStickerItem } from '../../lib/api'
import { showToast } from '../../lib/toast'

const PAGE_SIZE = 20

export default function AssetGrid() {
  const [items, setItems] = createSignal<UserStickerItem[]>([])
  const [loading, setLoading] = createSignal(true)
  const [loadingMore, setLoadingMore] = createSignal(false)
  const [total, setTotal] = createSignal(0)
  const [search, setSearch] = createSignal('')
  const [activeCategory, setActiveCategory] = createSignal('all')
  const [error, setError] = createSignal<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false)
  const [pendingDeleteId, setPendingDeleteId] = createSignal<number | null>(null)
  const [renamingId, setRenamingId] = createSignal<number | null>(null)
  const [renameValue, setRenameValue] = createSignal('')
  const [uploading, setUploading] = createSignal(false)
  let fileInput: HTMLInputElement | undefined
  let renameInput: HTMLInputElement | undefined

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.userStickers.list({ page: 1, limit: PAGE_SIZE })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore() || items().length >= total()) return
    setLoadingMore(true)
    try {
      const page = Math.floor(items().length / PAGE_SIZE) + 1
      const res = await api.userStickers.list({ page, limit: PAGE_SIZE })
      setItems((prev) => [...prev, ...res.data.items])
      setTotal(res.data.total)
    } catch (err: any) {
      showToast(err.message || '加载更多失败')
    } finally {
      setLoadingMore(false)
    }
  }

  onMount(() => {
    load()
  })

  const handleUpload = async (e: Event) => {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const name = file.name.replace(/\.[^/.]+$/, '')
      await api.userStickers.create(file, name)
      await load()
      showToast('已上传')
    } catch (err: any) {
      showToast(err.message || '上传失败')
    } finally {
      setUploading(false)
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
      await api.userStickers.remove(id)
      setItems(items().filter(i => i.id !== id))
      showToast('已删除')
    } catch (err: any) {
      showToast(err.message || '删除失败')
    }
  }

  const startRename = (item: UserStickerItem) => {
    setRenamingId(item.id)
    setRenameValue(item.name)
    setTimeout(() => renameInput?.focus(), 50)
  }

  const confirmRename = async (id: number) => {
    const newName = renameValue().trim()
    if (!newName) {
      setRenamingId(null)
      return
    }
    try {
      await api.userStickers.update(id, { name: newName })
      setItems(items().map(i => i.id === id ? { ...i, name: newName } : i))
      showToast('已重命名')
    } catch (err: any) {
      showToast(err.message || '重命名失败')
    }
    setRenamingId(null)
  }

  const categories = () => {
    const catSet = new Set<string>()
    items().forEach(i => catSet.add(i.category))
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

  const filtered = () => {
    let result = items()
    const q = search().toLowerCase()
    if (q) result = result.filter(i => i.name.toLowerCase().includes(q))
    if (activeCategory() !== 'all') result = result.filter(i => i.category === activeCategory())
    return result
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
          disabled={uploading()}
        >
          <span class="material-symbols-outlined text-primary">{uploading() ? 'progress_activity' : 'cloud_upload'}</span>
        </button>
      </header>

      <main class="pt-4 pb-24 space-y-4 container-content">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            class="w-full bg-surface border border-outline-variant rounded-lg py-3 pl-12 pr-4 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors placeholder:text-on-surface-variant"
            placeholder="查找素材名称..."
            type="text"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        <Show when={categories().length > 0}>
          <div class="flex overflow-x-auto gap-2 pb-1" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
            <button
              class={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                activeCategory() === 'all'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/60'
              }`}
              onClick={() => setActiveCategory('all')}
            >
              全部
            </button>
            <For each={categories()}>
              {(cat) => (
                <button
                  class={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    activeCategory() === cat
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/60'
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {categoryLabel(cat)}
                </button>
              )}
            </For>
          </div>
        </Show>

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
                  {search() || activeCategory() !== 'all' ? '没有匹配的素材' : '还没有上传过素材'}
                </p>
              </div>
            }>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <For each={filtered()}>
                  {(item) => (
                    <div class="group relative bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col aspect-[4/5] hover:border-primary transition-colors transition-transform hover:-translate-y-0.5 duration-200">
                      <div class="flex-1 bg-surface-variant/30 overflow-hidden relative">
                        <ProductImage
                          src={item.url}
                          alt={item.name}
                          aspect="aspect-[4/5]"
                          rounded="rounded-none"
                          fallbackLabel={item.name}
                          objectFit="contain"
                          class="p-2 group-hover:opacity-90 transition-opacity duration-300"
                        />
                        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            class="bg-surface/90 backdrop-blur-md p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors tap-target"
                            onClick={() => startRename(item)}
                            aria-label="重命名"
                          >
                            <span class="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            class="bg-surface/90 backdrop-blur-md p-2 rounded-lg text-on-surface-variant hover:text-error transition-colors tap-target"
                            onClick={() => requestDelete(item.id)}
                            aria-label="删除"
                          >
                            <span class="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                      <div class="p-3">
                        <Show
                          when={renamingId() === item.id}
                          fallback={
                            <p class="font-semibold text-sm text-on-surface truncate">{item.name}</p>
                          }
                        >
                          <input
                            ref={renameInput}
                            class="w-full bg-surface border border-primary rounded px-2 py-1 text-sm font-semibold text-on-surface outline-none"
                            value={renameValue()}
                            onInput={(e) => setRenameValue(e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmRename(item.id)
                              if (e.key === 'Escape') setRenamingId(null)
                            }}
                            onBlur={() => confirmRename(item.id)}
                          />
                        </Show>
                        <p class="text-label-md text-outline mt-1">
                          {item.width}×{item.height}
                        </p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <LoadMore hasMore={items().length < total()} loading={loadingMore()} onLoadMore={loadMore} />
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
