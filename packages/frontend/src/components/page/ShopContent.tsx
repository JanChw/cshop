import { createSignal, createMemo, Show, onMount, onCleanup } from 'solid-js'
import ProductCard from '../ui/ProductCard'
import CategoryChips from '../ui/CategoryChips'
import ScrollRow from '../ui/ScrollRow'
import SkeletonCard from '../ui/SkeletonCard'
import { useInfiniteScroll } from '../../lib/useInfiniteScroll'


interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  tags?: string[]
  fabric: string
  fit: string
  sizes: string[]
}

interface Props {
  products: Product[]
}

const FABRIC_OPTS = [
  { value: '', label: '全部面料' },
  { value: '棉质', label: '棉质' },
  { value: '涤纶', label: '涤纶' },
  { value: '混纺', label: '混纺' },
]

const FIT_OPTS = [
  { value: '', label: '全部版型' },
  { value: '宽松', label: '宽松' },
  { value: '修身', label: '修身' },
  { value: '常规', label: '常规' },
]

const SIZE_OPTS = [
  { value: '', label: '全部尺码' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
]

const PRICE_OPTS = [
  { value: '', label: '全部价格' },
  { value: '0-100', label: '¥0-100' },
  { value: '100-200', label: '¥100-200' },
  { value: '200+', label: '¥200+' },
]

const SORT_OPTS = [
  { value: 'default', label: '综合排序' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'newest', label: '最新上架' },
] as const

function matchPrice(price: number, range: string): boolean {
  if (!range) return true
  if (range === '0-100') return price <= 100
  if (range === '100-200') return price > 100 && price <= 200
  if (range === '200+') return price > 200
  return true
}

const categoryMap: Record<string, string> = {
  '基础款': 'Basics',
  '核心款': 'Essentials',
  '设计师款': 'Designer',
  '定制款': 'Custom'
}

export default function ShopContent(props: Props) {
  const [activeCategory, setActiveCategory] = createSignal('all')
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [filterFabric, setFilterFabric] = createSignal('')
  const [filterFit, setFilterFit] = createSignal('')
  const [filterSize, setFilterSize] = createSignal('')
  const [filterPrice, setFilterPrice] = createSignal('')
  const [sortMode, setSortMode] = createSignal<'default' | 'price-asc' | 'newest'>('default')
  const [filterPanelOpen, setFilterPanelOpen] = createSignal(false)

  const [showScrollTop, setShowScrollTop] = createSignal(false)

  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    if (cat) {
      const map: Record<string, string> = { Basics: '基础款', Essentials: '核心款', Designer: '设计师款', Custom: '定制款' }
      const zh = map[cat]
      if (zh) setActiveCategory(cat)
    }

    const onScroll = () => setShowScrollTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => window.removeEventListener('scroll', onScroll))
  })

  const filteredProducts = createMemo(() => {
    let list = props.products

    if (activeCategory() !== 'all') {
      const catZh = Object.entries(categoryMap).find(([, en]) => en === activeCategory())?.[0]
      if (catZh) list = list.filter((p) => p.category === catZh)
    }

    if (filterFabric()) list = list.filter(p => p.fabric === filterFabric())
    if (filterFit()) list = list.filter(p => p.fit === filterFit())
    if (filterSize()) list = list.filter(p => p.sizes.includes(filterSize()))
    if (filterPrice()) list = list.filter(p => matchPrice(p.price, filterPrice()))

    if (sortMode() === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price)
    } else if (sortMode() === 'newest') {
      list = [...list].sort((a, b) => parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, '')))
    }

    return list
  })

  const { visibleItems, loading, allLoaded, sentinelRef } = useInfiniteScroll(filteredProducts, 6)

  const activeFilterCount = createMemo(() => {
    let c = 0
    if (filterFabric()) c++
    if (filterFit()) c++
    if (filterSize()) c++
    if (filterPrice()) c++
    return c
  })

  const handleCategoryChange = (zh: string) => {
    const en = categoryMap[zh] || 'all'
    setActiveCategory(en)
  }

  const filterLabel = (opts: { value: string; label: string }[], value: string): string =>
    opts.find(o => o.value === value)?.label ?? value

  const resetFilters = () => {
    setFilterFabric('')
    setFilterFit('')
    setFilterSize('')
    setFilterPrice('')
    setSortMode('default')
  }



  const FilterGroup = (p: {
    title: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
  }) => {
    return (
      <div>
        <h4 class="text-label-md font-bold text-on-surface mb-3">{p.title}</h4>
        <ScrollRow class="flex overflow-x-auto gap-3 hide-scrollbar">
          {p.options.map(opt => (
            <button
              type="button"
              onClick={() => p.onChange(opt.value)}
              class={`px-4 py-2 rounded-lg text-label-md transition-colors tap-target flex-shrink-0 whitespace-nowrap ${
                p.value === opt.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </ScrollRow>
      </div>
    )
  }

  return (
    <main class="md:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      {/* Category header */}
      <section class="pt-stack-lg pb-stack-md relative">
        <div class="container-content relative">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <span class="text-label-md tracking-wider text-on-surface-variant uppercase">Shop</span>
              <div class="flex items-center gap-4">
                <h1 class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface">探索精品</h1>
                <div class="w-8 h-0.5 bg-primary rounded-full hidden md:block shrink-0" />
              </div>
            </div>
            <a href="/search" class="md:hidden flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-on-surface transition-colors tap-target shrink-0" aria-label="搜索">
              <span class="material-symbols-outlined text-2xl">search</span>
            </a>
          </div>
        </div>
        {/* CategoryChips - mobile only */}
        <div class="container-content mt-stack-md md:hidden">
          <div class="bg-primary-container/20 -mx-container-margin px-container-margin md:mx-0 md:px-0 md:rounded-xl py-3">
            <div class="-mr-container-margin md:mr-0">
              <CategoryChips
                items={[
                  { zh: '全部' },
                  { zh: '基础款', en: 'Basics' },
                  { zh: '核心款', en: 'Essentials' },
                  { zh: '设计师款', en: 'Designer' },
                  { zh: '定制款', en: 'Custom' }
                ]}
                active={activeCategory() === 'all' ? '全部' : Object.entries(categoryMap).find(([, en]) => en === activeCategory())?.[0] || '全部'}
                onChange={handleCategoryChange}
                variant="rounded-full"
              />
            </div>
          </div>
        </div>

      </section>

        {/* Tablet: Filter + Sort bar */}
        <div class="hidden md:block container-content mt-2 relative">
          <div class="flex items-center gap-6 bg-surface-container-low rounded-xl px-5 py-3">
            <div class="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
              <Show when={activeFilterCount() > 0}>
                <Show when={filterFabric()}>
                  <span class="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-primary-container text-primary text-label-md font-medium whitespace-nowrap shrink-0">
                    面料: {filterLabel(FABRIC_OPTS, filterFabric())}
                    <button type="button" onClick={() => setFilterFabric('')} class="flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/20 transition-colors">
                      <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                </Show>
                <Show when={filterFit()}>
                  <span class="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-primary-container text-primary text-label-md font-medium whitespace-nowrap shrink-0">
                    版型: {filterLabel(FIT_OPTS, filterFit())}
                    <button type="button" onClick={() => setFilterFit('')} class="flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/20 transition-colors">
                      <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                </Show>
                <Show when={filterSize()}>
                  <span class="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-primary-container text-primary text-label-md font-medium whitespace-nowrap shrink-0">
                    尺码: {filterLabel(SIZE_OPTS, filterSize())}
                    <button type="button" onClick={() => setFilterSize('')} class="flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/20 transition-colors">
                      <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                </Show>
                <Show when={filterPrice()}>
                  <span class="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-primary-container text-primary text-label-md font-medium whitespace-nowrap shrink-0">
                    价格: {filterLabel(PRICE_OPTS, filterPrice())}
                    <button type="button" onClick={() => setFilterPrice('')} class="flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/20 transition-colors">
                      <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                </Show>
              </Show>

              <button
                type="button"
                onClick={() => setFilterPanelOpen(p => !p)}
                class={`flex items-center gap-1 px-2 py-1 text-label-md font-bold tap-target transition-colors shrink-0 ${
                  filterPanelOpen()
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span class="material-symbols-outlined text-lg">{filterPanelOpen() ? 'expand_less' : 'tune'}</span>
                <span>筛选{activeFilterCount() > 0 ? ` (${activeFilterCount()})` : ''}</span>
              </button>
            </div>

            <div class="w-px h-6 bg-outline-variant shrink-0" />

            <div class="flex items-center gap-2 shrink-0">
              {SORT_OPTS.map((opt, i) => [
                i > 0 ? <span class="text-outline-variant text-label-md">·</span> : null,
                <button
                  type="button"
                  onClick={() => setSortMode(opt.value)}
                  class={`whitespace-nowrap text-label-md tap-target transition-colors ${
                    sortMode() === opt.value ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ])}
            </div>
          </div>

          <Show when={filterPanelOpen()}>
            <div class="fixed inset-0 z-20" onClick={() => setFilterPanelOpen(false)} />
            <div class="absolute left-0 right-0 top-full mt-1 z-30 bg-surface-container-low rounded-xl p-5 space-y-4 shadow-elevated">
              <FilterGroup title="面料" options={FABRIC_OPTS} value={filterFabric()} onChange={setFilterFabric} />
              <FilterGroup title="版型" options={FIT_OPTS} value={filterFit()} onChange={setFilterFit} />
              <FilterGroup title="尺码" options={SIZE_OPTS} value={filterSize()} onChange={setFilterSize} />
              <FilterGroup title="价格" options={PRICE_OPTS} value={filterPrice()} onChange={setFilterPrice} />

              <div class="flex justify-between items-center pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={resetFilters}
                  class="text-label-md font-bold text-on-surface-variant tap-target hover:text-on-surface transition-colors"
                >
                  × 重置筛选
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPanelOpen(false)}
                  class="text-label-md font-bold text-primary tap-target hover:underline transition-colors"
                >
                  收起
                </button>
              </div>
            </div>
          </Show>
        </div>

      <div class="md:flex md:container-content md:gap-6 md:items-start">
        {/* Tablet: Categories sidebar */}
        <aside class="hidden md:block w-36 shrink-0">
          <div class="sticky top-20 bg-surface-container-low rounded-xl p-4">
            <h3 class="text-label-md font-bold text-on-surface mb-3">分类</h3>
            <div class="space-y-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                class={`w-full text-left px-3 py-2 rounded-lg text-body-sm transition-colors tap-target ${
                  activeCategory() === 'all'
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                全部
              </button>
              {Object.entries(categoryMap).map(([zh, en]) => (
                <button
                  type="button"
                  onClick={() => setActiveCategory(en)}
                  class={`w-full text-left px-3 py-2 rounded-lg text-body-sm transition-colors tap-target ${
                    activeCategory() === en
                      ? 'text-primary font-bold bg-primary/10'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {zh}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div class="flex-1 min-w-0 md:min-h-[60vh]">
          {/* Mobile filter bar */}
          <section class="px-container-margin md:px-0 py-3 flex items-center justify-between sticky top-0 md:static bg-background/80 backdrop-blur-lg z-30">
            <div class="flex items-center gap-2 overflow-x-auto hide-scrollbar md:hidden" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
              <span class="text-label-md text-on-surface-variant whitespace-nowrap mr-1">{filteredProducts().length}件</span>
              {SORT_OPTS.map((opt, i) => [
                i > 0 ? <span class="text-outline-variant text-label-md">·</span> : null,
                <button
                  type="button"
                  onClick={() => setSortMode(opt.value)}
                  class={`whitespace-nowrap text-label-md tap-target transition-colors ${
                    sortMode() === opt.value ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ])}
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              class="md:hidden flex items-center gap-1.5 text-primary text-label-md shrink-0 tap-target"
            >
              <span class="material-symbols-outlined text-lg">tune</span>
              <span>筛选{activeFilterCount() > 0 ? ` (${activeFilterCount()})` : ''}</span>
            </button>
          </section>

          {/* Product grid */}
          <section class="px-container-margin md:px-0 py-stack-lg grid grid-cols-2 md:grid-cols-3 gap-x-gutter gap-y-stack-md">
            {visibleItems().map((product) => (
              <ProductCard product={product} variant="shop" />
            ))}
            <Show when={filteredProducts().length === 0}>
              <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <span class="material-symbols-outlined text-outline text-5xl mb-4">search_off</span>
                <p class="text-on-surface-variant font-headline text-body-lg">没有符合条件的商品</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  class="mt-4 text-primary font-bold tap-target hover:underline"
                >
                  清除筛选
                </button>
              </div>
            </Show>
          </section>

          {/* Loading skeleton */}
          <Show when={loading() && filteredProducts().length > 0}>
            <div class="px-container-margin md:px-0 grid grid-cols-2 md:grid-cols-3 gap-x-gutter gap-y-stack-md">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </Show>

          {/* Sentinel */}
          <div ref={sentinelRef} class="h-px" />

          {/* All loaded */}
          <Show when={allLoaded() && filteredProducts().length > 0}>
            <p class="text-center font-headline text-body-sm text-on-surface-variant/50 py-8">
              — 已展示全部 {filteredProducts().length} 件商品 —
            </p>
          </Show>
        </div>
      </div>

      {/* Bottom Sheet */}
      <Show when={filterOpen()}>
        <div class="fixed inset-0 z-50 flex items-end">
          <div class="absolute inset-0 bg-black/60" onClick={() => setFilterOpen(false)} />
          <div class="relative w-full bg-surface rounded-t-3xl max-h-[80vh] overflow-y-auto hide-scrollbar shadow-2xl">
            <div class="sticky top-0 bg-surface rounded-t-3xl px-6 py-3 border-b border-outline-variant flex flex-col items-center z-10">
              <div class="w-9 h-1 bg-outline-variant/40 rounded-full mb-3" />
              <div class="flex justify-between items-center w-full">
                <h3 class="text-title-md font-bold text-on-surface">筛选</h3>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  class="tap-target p-1 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <span class="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
            </div>

            <div class="px-6 py-4 space-y-6">
              <FilterGroup title="面料" options={FABRIC_OPTS} value={filterFabric()} onChange={setFilterFabric} />
              <FilterGroup title="版型" options={FIT_OPTS} value={filterFit()} onChange={setFilterFit} />
              <FilterGroup title="尺码" options={SIZE_OPTS} value={filterSize()} onChange={setFilterSize} />
              <FilterGroup title="价格" options={PRICE_OPTS} value={filterPrice()} onChange={setFilterPrice} />
            </div>

            <div class="sticky bottom-0 bg-surface px-6 py-4 border-t border-outline-variant flex gap-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => { resetFilters() }}
                class="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface font-bold tap-target active:scale-95 transition-transform"
              >
                重置
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                class="flex-1 py-3 rounded-lg bg-primary text-on-primary font-bold tap-target active:scale-95 transition-transform"
              >
                确认（{filteredProducts().length}件）
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Scroll to top */}
      <Show when={showScrollTop()}>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          class="fixed right-6 bottom-[11.5rem] w-14 h-14 bg-surface-container-high text-on-surface-variant rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-colors transition-transform tap-target z-40 hover:bg-primary hover:text-on-primary"
          aria-label="回到顶部"
        >
          <span class="material-symbols-outlined">arrow_upward</span>
        </button>
      </Show>

      {/* Mobile cart FAB */}
      <a
        href="/cart"
        class="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform tap-target z-40 before:absolute before:-inset-4 before:rounded-full before:bg-primary/20 before:blur-xl before:-z-10"
        aria-label="购物车"
      >
        <span class="material-symbols-outlined">shopping_cart</span>
      </a>
    </main>
  )
}
