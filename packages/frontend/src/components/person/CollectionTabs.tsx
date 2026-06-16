import { createSignal, createMemo } from 'solid-js'
import { showToast } from '../../lib/toast'

interface Product {
  id: string
  name: string
  price: number
  image: string
  description?: string
}

interface Draft {
  id: string
  name: string
  image: string
  lastEdited: string
  label: string
}

const mockFavorites: Product[] = [
  { id: 'f1', name: '手工陶艺纹理花瓶', price: 280, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYvbbfJj0LDUY6cRPJN5WFFxRII-6pw4L1Jg5ZwmHEGp-e35k2KCIfafqoqJda5T2i_ro17kfMPxoUcYw-_E9MVCpw9ElplR4P_aXC3jpfWZM8qlB3MI5YP2xexGOV8ByN-Ulz7A9jk9ikhIXck_K4_TgAyIy6S7DmZix_mi3eWWDhICJNG-JXyOLbEjH2DqBOO0ANUHzFSU9fnAJz76ScdjAlwTIapN6CjPKb6zvOk28UIbini_MFDdXtogk2wjnEOx2qYkedO4Q', description: 'Sahara 极简系列 - 温暖亚麻质感' },
  { id: 'f2', name: '自然棉麻床品套装', price: 1240, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt-46XIzcZlk4NVxxw9uW0ygdch8BVrnZbzbopfAfPJe7SK-5ZQur3GjsP2AxKG7CpOLXVatRbYLNuneaunG5J7eOxfkl3xWaXgbaXVoeAHoxZwuKJVHZsMpaPnROqGx81i8v8T01uHPz8CSrWbCh-aNtUcMOfLlI8g6nPlehrbajR5_sOg88ioZaS-LgifjKZEqckBdX4Cz0_peiclQcMPRNwMa5AyZYOC836f3mTKV1g-O_GXwfr9TUYC2sJPMzVLOn0jM52-cA', description: '100% 纯天然长绒棉，呼吸感触感' }
]

const mockDrafts: Draft[] = [
  { id: 'd1', name: 'Sahara 扶手椅方案', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA03Msu7_Ouh03U-tLA9h7lYyvCTFw8h86SlR0FshlWVChfihygU8oYYtmw5wyWhv0DdWAX-0hE_43VbdUHO8dTJOpsY9UvYa2MOv5Jj6EFwSO1Odse-5MdxfTeNW19FKUsNSfro0wkNvMv32GuU4OfB62lbjjzyTm8MeL6vGwdsDqCNrOWc-ad4j6mIkf6KWd42pwa5In3gmIlzTfMTeoAG50CbixPd89zb8nZdm-tkyi5l_EQbeOWei95SaYLOCGRI2beOwMiSa4', lastEdited: '2小时前', label: '草稿 #04' },
  { id: 'd2', name: '抽象极简装饰画', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANqnfF4MB6DLQxr8sWHNLDR7iune1C4dUaTmElC26SvFhvlOGAfO1Vtul5DuSxLx2V0otwvQvgvon-7VTso_0nblqITFM9Vq8wu8Y2ZWO1y5BGILcGpK7ZRFJY2BXqH7hERTFztsB7pYuFZImzQhzsyUK4-R0XNN0C8gzlE9YINmqpDSktqdCT5xftZTW60-EP8xh580OYuFLwFFfmW4l8UGGv2Xyn5I2VtkS4URTsJg4oVQcJwlc54Y-_amqMI0Nt0SKZAtQlMEo', lastEdited: '昨天', label: '草稿 #02' }
]

export default function CollectionTabs() {
  const [activeTab, setActiveTab] = createSignal<'favorites' | 'drafts'>('favorites')
  const [favorites, setFavorites] = createSignal<Set<string>>(new Set())

  const showFab = createMemo(() => activeTab() === 'drafts')

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div>
      <header class="bg-surface border-b border-outline-variant flex justify-between items-center px-6 h-16 w-full sticky top-0 z-40">
        <button onclick={() => history.back()} class="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full">arrow_back</button>
        <h1 class="font-headline text-2xl font-bold text-primary">收藏与草稿</h1>
        <button onclick={() => showToast('搜索功能即将上线')} class="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full">search</button>
      </header>

      <main class=" px-6 pt-8 pb-24">
        <div class="flex items-center gap-8 mb-8 border-b border-outline-variant/60">
          <button onclick={() => setActiveTab('favorites')}
            class={`pb-3 text-lg font-medium transition-all ${activeTab() === 'favorites' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'}`}>
            我的收藏
          </button>
          <button onclick={() => setActiveTab('drafts')}
            class={`pb-3 text-lg font-medium transition-all ${activeTab() === 'drafts' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'}`}>
            设计草稿
          </button>
        </div>

        {activeTab() === 'favorites' && (
          <div class="grid grid-cols-1 gap-8">
            {mockFavorites.map((item) => (
              <div class="bg-surface-container-low rounded-xl overflow-hidden shadow-card group hover:-translate-y-1 transition-transform duration-300">
                <div class="aspect-[4/5] relative overflow-hidden bg-surface-container">
                  <img class="w-full h-full object-cover" src={item.image} alt={item.name} />
                  <button onclick={(e) => { e.stopPropagation(); toggleFav(item.id) }}
                    class="absolute top-4 right-4 bg-surface/80 backdrop-blur-md p-2 rounded-full text-primary shadow-sm">
                    <span class="material-symbols-outlined" style={`font-variation-settings:'FILL' ${favorites().has(item.id) ? 1 : 0}`}>favorite</span>
                  </button>
                </div>
                <div class="p-6">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-headline font-semibold text-on-surface">{item.name}</h3>
                    <span class="text-primary font-bold">¥ {item.price}</span>
                  </div>
                  <p class="text-on-surface-variant text-sm mb-4">{item.description}</p>
                  <button onclick={() => showToast('已加入购物车')}
                    class="w-full py-3 bg-primary text-on-primary rounded-lg text-sm font-bold tracking-wide hover:opacity-90">加入购物车</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab() === 'drafts' && (
          <div class="grid grid-cols-1 gap-6">
            <a href="/design"
              class="bg-surface-container-highest border-2 border-dashed border-outline-variant flex flex-col items-center justify-center p-8 rounded-xl h-[400px] hover:border-primary transition-colors group">
              <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-4 group-hover:text-primary">add_circle</span>
              <p class="font-medium text-on-surface-variant">开启新创作</p>
            </a>
            {mockDrafts.map((draft) => (
              <div class="bg-surface-container-low rounded-xl overflow-hidden shadow-card relative h-[400px]">
                <div class="h-2/3 bg-surface-container overflow-hidden">
                  <img class="w-full h-full object-cover" src={draft.image} alt={draft.name} />
                </div>
                <div class="p-4 h-1/3 flex flex-col justify-between">
                  <div>
                    <h3 class="font-headline text-lg font-bold">{draft.name}</h3>
                    <p class="text-xs text-on-surface-variant mt-1">最后编辑：{draft.lastEdited}</p>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full">{draft.label}</span>
                    <button onclick={() => showToast('编辑功能即将上线')} class="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full">edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showFab() && (
        <button class="fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all z-40"
          onclick={() => showToast('创作功能即将上线')}>
          <span class="material-symbols-outlined">add</span>
        </button>
      )}
    </div>
  )
}
