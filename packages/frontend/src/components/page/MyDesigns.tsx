import { createSignal, For, onMount, Show } from 'solid-js'
import { api, type DesignItem } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function MyDesigns() {
  const [items, setItems] = createSignal<DesignItem[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.designs.list()
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

  const remove = async (id: number) => {
    if (!confirm('确定删除这个设计？')) return
    try {
      await api.designs.remove(id)
      setItems(items().filter(i => i.id !== id))
      showToast('已删除')
    } catch (err: any) {
      showToast(err.message || '删除失败')
    }
  }

  const fmtDate = (s: string) => {
    try {
      const d = new Date(s)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return s
    }
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface" style="font-family: 'Manrope', sans-serif">
      <header class="bg-surface sticky top-0 z-50 flex justify-between items-center px-4 h-16 border-b border-outline-variant">
        <a href="/person" class="p-2 hover:bg-surface-container-high rounded-full transition-colors" aria-label="返回">
          <span class="material-symbols-outlined text-primary">arrow_back</span>
        </a>
        <h1 class="text-lg font-bold text-primary">我的设计</h1>
        <a href="/design" class="p-2 hover:bg-surface-container-high rounded-full transition-colors" aria-label="新建设计">
          <span class="material-symbols-outlined text-primary">add</span>
        </a>
      </header>

      <main class="px-4 max-w-md mx-auto pt-4 space-y-4">
        <Show when={!loading()} fallback={
          <div class="text-center py-20 text-secondary">
            <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        }>
          <Show when={!error()} fallback={
            <div class="text-center py-20">
              <span class="material-symbols-outlined text-error text-4xl">error</span>
              <p class="text-sm text-error mt-2">{error()}</p>
              <button
                class="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
                onClick={load}
              >
                重试
              </button>
            </div>
          }>
            <Show when={items().length > 0} fallback={
              <div class="text-center py-20 space-y-4">
                <span class="material-symbols-outlined text-outline text-6xl">palette</span>
                <h2 class="text-lg font-bold text-on-surface">还没有设计</h2>
                <p class="text-sm text-on-surface-variant">开始创作你的第一个设计</p>
                <a
                  href="/design"
                  class="inline-block px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm"
                >
                  前往设计
                </a>
              </div>
            }>
              <div class="grid grid-cols-2 gap-3">
                <For each={items()}>
                  {(item) => (
                    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col aspect-[4/5] hover:border-primary transition-all group">
                      <a href={`/design?design=${item.id}`} class="flex-1 bg-surface-variant/30 overflow-hidden relative">
                        <Show
                          when={item.previewImage}
                          fallback={
                            <div class="w-full h-full flex items-center justify-center">
                              <span class="material-symbols-outlined text-outline text-3xl">image</span>
                            </div>
                          }
                        >
                          <img
                            class="w-full h-full object-contain"
                            src={item.previewImage!}
                            alt={item.name}
                            loading="lazy"
                          />
                        </Show>
                      </a>
                      <div class="p-3 flex justify-between items-start gap-2">
                        <div class="flex-1 min-w-0">
                          <p class="font-semibold text-sm text-on-surface truncate">{item.name}</p>
                          <p class="text-[10px] text-secondary mt-0.5">{fmtDate(item.updatedAt)}</p>
                        </div>
                        <button
                          class="p-1.5 rounded-lg hover:bg-error-container/30 hover:text-error text-on-surface-variant transition-all shrink-0"
                          onClick={() => remove(item.id)}
                          aria-label="删除"
                        >
                          <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </Show>
      </main>
    </div>
  )
}
