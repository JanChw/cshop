import { createSignal, createMemo, onMount } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'
import { api } from '../../lib/api'

interface Product {
  id: string
  name: string
  price: number
  image: string
  description?: string
}

interface Draft {
  id: number
  name: string
  image: string
  lastEdited: string
  label: string
}

const mockFavorites: Product[] = [
  { id: 'f1', name: '手工陶艺纹理花瓶', price: 280, image: 'https://picsum.photos/seed/73d981934805/400/500', description: 'Sahara 极简系列 - 温暖亚麻质感' },
  { id: 'f2', name: '自然棉麻床品套装', price: 1240, image: 'https://picsum.photos/seed/4f0e1025495a/400/500', description: '100% 纯天然长绒棉，呼吸感触感' }
]

export default function CollectionTabs() {
  const [activeTab, setActiveTab] = createSignal<'favorites' | 'drafts'>('favorites')
  const [favorites, setFavorites] = createSignal<Set<string>>(new Set())
  const [drafts, setDrafts] = createSignal<Draft[]>([])

  onMount(async () => {
    try {
      const res = await api.designs.list()
      if (res.success) {
        setDrafts(res.data.items.map((d: any) => ({
          id: d.id,
          name: d.name || '未命名设计',
          image: d.previewImage || `https://picsum.photos/seed/${d.id}/400/500`,
          lastEdited: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '未知',
          label: `设计 #${d.id}`
        })))
      }
    } catch (e) {
      console.error('Failed to load designs', e)
    }
  })

  const showFab = createMemo(() => activeTab() === 'drafts')

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface h-16 flex justify-between items-center px-4 border-b border-outline-variant">
        <a
          href="/person"
          class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
          aria-label="返回"
        >
          <span class="material-symbols-outlined text-primary">arrow_back</span>
        </a>
        <h1 class="text-lg font-bold text-primary">收藏与草稿</h1>
        <button
          type="button"
          onClick={() => showToast('搜索功能即将上线')}
          class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
          aria-label="搜索"
        >
          <span class="material-symbols-outlined text-primary">search</span>
        </button>
      </header>

      <main class="container-content pt-8 pb-24">
        <div class="flex items-center gap-8 mb-8 border-b border-outline-variant/60">
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            class={`pb-3 text-lg font-medium transition-colors tap-target ${activeTab() === 'favorites' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            我的收藏
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            class={`pb-3 text-lg font-medium transition-colors tap-target ${activeTab() === 'drafts' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            设计草稿
          </button>
        </div>

        {activeTab() === 'favorites' && (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {mockFavorites.map((item) => (
              <div class="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/40 group hover:border-outline hover:-translate-y-0.5 transition-colors transition-transform duration-200">
                <div class="aspect-[4/5] relative overflow-hidden bg-surface-container">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    aspect="aspect-[4/5]"
                    rounded="rounded-none"
                    fallbackLabel={item.name}
                    class="w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFav(item.id) }}
                    class="absolute top-4 right-4 tap-target bg-surface/80 backdrop-blur-md p-2 rounded-full text-primary"
                    aria-label={favorites().has(item.id) ? '取消收藏' : '加入收藏'}
                  >
                    <span class="material-symbols-outlined" style={`font-variation-settings:'FILL' ${favorites().has(item.id) ? 1 : 0}`}>favorite</span>
                  </button>
                </div>
                <div class="p-6">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-headline font-semibold text-on-surface truncate">{item.name}</h3>
                    <span class="text-primary font-bold">¥ {item.price}</span>
                  </div>
                  <p class="text-on-surface-variant text-sm mb-4">{item.description}</p>
                  <button
                    type="button"
                    onClick={() => showToast('已加入购物车')}
                    class="w-full py-3 bg-primary text-on-primary rounded-lg text-sm font-bold tracking-wide hover:opacity-90 tap-target"
                  >
                    加入购物车
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab() === 'drafts' && (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <a href="/design"
              class="bg-surface-container-highest border-2 border-dashed border-outline-variant flex flex-col items-center justify-center p-8 rounded-xl min-h-[400px] hover:border-primary transition-colors group">
              <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-4 group-hover:text-primary">add_circle</span>
              <p class="font-medium text-on-surface-variant">开启新创作</p>
            </a>
            {drafts().map((draft) => (
              <div class="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/40 relative min-h-[400px]">
                <div class="h-2/3 bg-surface-container overflow-hidden">
                  <ProductImage
                    src={draft.image}
                    alt={draft.name}
                    aspect="aspect-[4/5]"
                    rounded="rounded-none"
                    fallbackLabel={draft.name}
                    class="w-full h-full"
                  />
                </div>
                <div class="p-4 h-1/3 flex flex-col justify-between">
                  <div>
                    <h3 class="font-headline text-lg font-bold">{draft.name}</h3>
                    <p class="text-xs text-on-surface-variant mt-1">最后编辑：{draft.lastEdited}</p>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full">{draft.label}</span>
                    <button
                      type="button"
                      onClick={() => showToast('编辑功能即将上线')}
                      class="tap-target material-symbols-outlined text-primary hover:bg-primary/10 p-2 rounded-full"
                      aria-label="编辑"
                    >
                      edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showFab() && (
        <button
          type="button"
          class="fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:scale-[1.08] active:scale-95 transition-transform duration-200 z-40 tap-target"
          onClick={() => showToast('创作功能即将上线')}
          aria-label="新建创作"
        >
          <span class="material-symbols-outlined">add</span>
        </button>
      )}
    </div>
  )
}
