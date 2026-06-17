import { createSignal, createMemo, onMount } from 'solid-js'
import ProductCard from '../ui/ProductCard'
import CategoryChips from '../ui/CategoryChips'

interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  tags?: string[]
}

interface Props {
  products: Product[]
}

export default function ShopContent(props: Props) {
  const [activeCategory, setActiveCategory] = createSignal('all')

  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    if (cat) {
      const map: Record<string, string> = { Basics: '基础系列', Essentials: '核心系列', Designer: '设计师款', Custom: '定制款' }
      const zh = map[cat]
      if (zh) setActiveCategory(cat)
    }
  })

  const categoryMap: Record<string, string> = {
    '基础系列': 'Basics',
    '核心系列': 'Essentials',
    '设计师款': 'Designer',
    '定制款': 'Custom'
  }

  const filteredProducts = createMemo(() => {
    if (activeCategory() === 'all') return props.products
    const catZh = Object.entries(categoryMap).find(([, en]) => en === activeCategory())?.[0]
    if (!catZh) return props.products
    return props.products.filter((p) => p.category === catZh)
  })

  const handleCategoryChange = (zh: string) => {
    const en = categoryMap[zh] || 'all'
    setActiveCategory(en)
  }

  return (
    <main class="md:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      {/* Mobile / Tablet shared header */}
      <section class="container-content pt-stack-lg pb-stack-md">
        <div class="flex flex-col gap-stack-md">
          <h1 class="text-headline-lg-mobile md:text-headline-lg text-on-surface">探索精品</h1>
          <CategoryChips
            items={[
              { zh: '全部' },
              { zh: '基础系列', en: 'Basics' },
              { zh: '核心系列', en: 'Essentials' },
              { zh: '设计师款', en: 'Designer' },
              { zh: '定制款', en: 'Custom' }
            ]}
            active={activeCategory() === 'all' ? '全部' : Object.entries(categoryMap).find(([, en]) => en === activeCategory())?.[0] || '全部'}
            onChange={handleCategoryChange}
          />
        </div>
      </section>

      <div class="md:flex md:container-content md:gap-6">
        {/* Tablet filter sidebar */}
        <aside class="hidden md:block w-44 shrink-0">
          <div class="sticky top-20 space-y-6">
            <div>
              <h3 class="text-body-lg font-bold text-on-surface mb-3">筛选</h3>
              <div class="space-y-2">
                {['面料: 棉质', '版型: 宽松', '价格: ¥200+'].map((filter) => (
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-outline-variant bg-surface text-label-md text-on-surface hover:bg-surface-container transition-colors tap-target"
                  >
                    <span>{filter}</span>
                    <span class="material-symbols-outlined text-base">keyboard_arrow_down</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 class="text-body-lg font-bold text-on-surface mb-3">排序</h3>
              <div class="space-y-2">
                {['综合排序', '价格从低到高', '最新上架'].map((sort) => (
                  <label class="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer tap-target">
                    <input type="radio" name="shop-sort" class="accent-primary" />
                    {sort}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div class="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <section class="px-container-margin md:px-0 py-stack-md flex items-center justify-between border-y border-outline-variant/30 md:border-t-0 sticky top-0 md:static bg-background z-30">
            <div class="flex gap-stack-md overflow-x-auto hide-scrollbar py-1 md:hidden" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
              {['面料: 棉质', '版型: 宽松', '价格: ¥200+'].map((filter) => (
                <button
                  type="button"
                  class="flex items-center gap-1 border border-outline text-on-surface rounded-lg px-3 py-1.5 whitespace-nowrap bg-surface text-label-md tap-target"
                >
                  <span>{filter}</span>
                  <span class="material-symbols-outlined text-base">keyboard_arrow_down</span>
                </button>
              ))}
            </div>
            <button type="button" class="ml-4 md:hidden flex items-center gap-2 text-primary text-label-md shrink-0 tap-target">
              <span class="material-symbols-outlined">tune</span>
              <span class="inline">筛选</span>
            </button>
          </section>

          {/* Product grid */}
          <section class="px-container-margin md:px-0 py-stack-lg grid grid-cols-2 md:grid-cols-2 gap-gutter">
            {filteredProducts().map((product) => (
              <ProductCard product={product} variant="shop" />
            ))}
          </section>
        </div>
      </div>

      {/* Mobile cart FAB */}
      <a
        href="/cart"
        class="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-lg shadow-lg flex items-center justify-center active:scale-95 transition-transform tap-target z-40"
        aria-label="购物车"
      >
        <span class="material-symbols-outlined">shopping_cart</span>
      </a>
    </main>
  )
}
