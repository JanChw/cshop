import { createSignal, createMemo, createEffect, For, Show } from 'solid-js'
import SearchInput from '../ui/SearchInput'
import ProductCard from '../ui/ProductCard'
import ScrollRow from '../ui/ScrollRow'
import SkeletonCard from '../ui/SkeletonCard'
import { useInfiniteScroll } from '../../lib/useInfiniteScroll'
import { FABRIC_OPTS, FIT_OPTS, SIZE_OPTS, PRICE_OPTS, SORT_OPTS, type SortMode, type Product, matchPrice } from '../../lib/shopFilters'

interface Props {
  products: Product[]
}

const CATEGORY_CHIPS = [
  { zh: '全部' },
  { zh: '基础款' },
  { zh: '核心款' },
  { zh: '设计师款' },
  { zh: '定制款' },
  { zh: '配饰' },
]

export default function SearchContent(props: Props) {
  const [query, setQuery] = createSignal('')
  const [activeChip, setActiveChip] = createSignal('全部')
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [filterFabric, setFilterFabric] = createSignal('')
  const [filterFit, setFilterFit] = createSignal('')
  const [filterSize, setFilterSize] = createSignal('')
  const [filterPrice, setFilterPrice] = createSignal('')
  const [sortMode, setSortMode] = createSignal<SortMode>('default')
  const [filterTab, setFilterTab] = createSignal<'面料' | '版型' | '尺码' | '价格'>('面料')

  let dialogRef: HTMLDivElement | undefined

  createEffect(() => {
    if (filterOpen()) {
      queueMicrotask(() => dialogRef?.focus())
    }
  })

  const trapDialogFocus = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFilterOpen(false)
      return
    }
    if (e.key !== 'Tab' || !dialogRef) return
    const focusable = dialogRef.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const filteredProducts = createMemo(() => {
    let result = props.products

    const q = query().trim().toLowerCase()
    if (q) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      )
    }

    const chip = activeChip()
    if (chip !== '全部') {
      result = result.filter((p) => p.category === chip)
    }

    if (filterFabric()) result = result.filter(p => p.fabric === filterFabric())
    if (filterFit()) result = result.filter(p => p.fit === filterFit())
    if (filterSize()) result = result.filter(p => p.sizes.includes(filterSize()))
    if (filterPrice()) result = result.filter(p => matchPrice(p.price, filterPrice()))

    if (sortMode() === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (sortMode() === 'newest') {
      result = [...result].sort((a, b) => parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, '')))
    }

    return result
  })

  const activeFilterCount = createMemo(() => {
    let c = 0
    if (filterFabric()) c++
    if (filterFit()) c++
    if (filterSize()) c++
    if (filterPrice()) c++
    return c
  })

  const resetFilters = () => {
    setFilterFabric('')
    setFilterFit('')
    setFilterSize('')
    setFilterPrice('')
    setSortMode('default')
  }

  const { visibleItems, loading, allLoaded, sentinelRef } = useInfiniteScroll(filteredProducts, 6)

  const FilterGroup = (p: {
    title: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
  }) => (
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

  return (
    <main class="md:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 min-h-screen">
      <section class="pt-stack-lg pb-stack-md container-content">
        <div class="flex items-stretch border border-outline-variant rounded-full bg-surface-container-low overflow-hidden md:max-w-xl md:mx-auto">
          <button
            type="button"
            onClick={() => window.history.back()}
            class="md:hidden flex items-center justify-center w-11 shrink-0 text-on-surface-variant hover:text-on-surface transition-colors tap-target"
            aria-label="返回"
          >
            <span class="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div class="w-px bg-outline-variant shrink-0 md:hidden" />
          <div class="flex-1 min-w-0">
            <SearchInput
              placeholder="搜索连帽衫、T恤..."
              value={query()}
              onInput={setQuery}
              class="[&_input]:!border-none [&_input]:!rounded-none [&_input]:!bg-transparent"
            />
          </div>
          <div class="w-px bg-outline-variant shrink-0" />
          <div class="relative flex items-center pl-3 pr-1 shrink-0">
            <select
              value={activeChip()}
              onChange={(e) => setActiveChip(e.currentTarget.value)}
              class="appearance-none bg-transparent text-on-surface text-body-sm focus:outline-none cursor-pointer py-[0.875rem] pr-5 text-center"
              aria-label="分类筛选"
            >
              {CATEGORY_CHIPS.map(c => (
                <option value={c.zh}>{c.zh}</option>
              ))}
            </select>
            <span class="material-symbols-outlined text-lg text-on-surface-variant absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>
        </div>
      </section>

      {/* Tablet filter tabs */}
      <section class="hidden md:block container-content pb-stack-md">
        <div class="flex justify-center gap-6 border-b border-outline-variant/30">
          {(['面料', '版型', '尺码', '价格'] as const).map(tab => (
            <button
              type="button"
              onClick={() => setFilterTab(tab)}
              class={`pb-2 text-label-md font-bold tap-target transition-colors border-b-2 -mb-[1px] ${
                filterTab() === tab
                  ? 'text-primary border-red-500'
                  : 'text-on-surface-variant border-transparent hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div class="pt-4">
          <Show when={filterTab() === '面料'}>
            <div class="flex flex-wrap justify-center gap-2">
              {FABRIC_OPTS.map(opt => (
                <button
                  type="button"
                  onClick={() => setFilterFabric(opt.value)}
                  class={`px-4 py-2 rounded-lg text-label-md transition-colors tap-target ${
                    filterFabric() === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Show>
          <Show when={filterTab() === '版型'}>
            <div class="flex flex-wrap justify-center gap-2">
              {FIT_OPTS.map(opt => (
                <button
                  type="button"
                  onClick={() => setFilterFit(opt.value)}
                  class={`px-4 py-2 rounded-lg text-label-md transition-colors tap-target ${
                    filterFit() === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Show>
          <Show when={filterTab() === '尺码'}>
            <div class="flex flex-wrap justify-center gap-2">
              {SIZE_OPTS.map(opt => (
                <button
                  type="button"
                  onClick={() => setFilterSize(opt.value)}
                  class={`px-4 py-2 rounded-lg text-label-md transition-colors tap-target ${
                    filterSize() === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Show>
          <Show when={filterTab() === '价格'}>
            <div class="flex flex-wrap justify-center gap-2">
              {PRICE_OPTS.map(opt => (
                <button
                  type="button"
                  onClick={() => setFilterPrice(opt.value)}
                  class={`px-4 py-2 rounded-lg text-label-md transition-colors tap-target ${
                    filterPrice() === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Show>
        </div>
      </section>
      <div class="md:flex md:container-content md:gap-6">
        <aside class="hidden md:block w-44 shrink-0">
          <div class="sticky top-20 space-y-6">
            <div>
              <h2 class="text-body-lg font-bold text-on-surface mb-3">排序</h2>
              <div class="space-y-2">
                {SORT_OPTS.map(opt => (
                  <label class="flex items-center gap-2 text-body-sm text-on-surface-variant tap-target">
                    <input
                      type="radio"
                      name="search-sort"
                      checked={sortMode() === opt.value}
                      onChange={() => setSortMode(opt.value)}
                      class="accent-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <Show when={activeFilterCount() > 0}>
              <button
                type="button"
                onClick={resetFilters}
                class="text-primary text-label-md font-bold tap-target hover:underline"
              >
                重置筛选
              </button>
            </Show>
          </div>
        </aside>

        <div class="flex-1 min-w-0">
          <section class="px-container-margin md:px-0 py-stack-md flex items-center justify-between border-y border-outline-variant/30 md:border-t-0">
            <p class="text-on-surface-variant text-body-sm">为您找到 {filteredProducts().length} 个结果</p>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              class="ml-4 md:hidden flex items-center gap-2 text-primary text-label-md shrink-0 tap-target"
            >
              <span class="material-symbols-outlined">tune</span>
              <span>筛选{activeFilterCount() > 0 ? ` (${activeFilterCount()})` : ''}</span>
            </button>
          </section>

          <section class="px-container-margin md:px-0 flex gap-stack-md overflow-x-auto hide-scrollbar py-1 md:hidden" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
            {SORT_OPTS.map(opt => (
              <button
                type="button"
                onClick={() => setSortMode(opt.value)}
                class={`flex items-center gap-1 border rounded-lg px-3 py-1.5 whitespace-nowrap bg-surface text-label-md tap-target transition-colors flex-shrink-0 ${
                  sortMode() === opt.value ? 'border-primary text-primary' : 'border-outline text-on-surface'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </section>

          <section class="px-container-margin md:px-0 py-stack-lg grid grid-cols-2 md:grid-cols-3 gap-gutter">
            <For each={visibleItems()}>
              {(product) => (
                <ProductCard product={product} variant="search" />
              )}
            </For>
            <Show when={filteredProducts().length === 0}>
              <div class="col-span-2 md:col-span-3 flex flex-col items-center justify-center py-20 text-center">
                <span class="material-symbols-outlined text-outline text-5xl mb-4">search_off</span>
                <p class="text-on-surface-variant text-body-lg">没有符合条件的商品</p>
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

          <Show when={loading() && filteredProducts().length > 0}>
            <div class="px-container-margin md:px-0 grid grid-cols-2 md:grid-cols-3 gap-gutter">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </Show>

          <div ref={sentinelRef} class="h-px" />

          <Show when={allLoaded() && filteredProducts().length > 0}>
            <p class="text-center text-body-sm text-on-surface-variant py-8">
              — 已展示全部 {filteredProducts().length} 件商品 —
            </p>
          </Show>
        </div>
      </div>

      <Show when={filterOpen()}>
        <div class="fixed inset-0 z-50 flex items-end">
          <div class="absolute inset-0 bg-black/60" onClick={() => setFilterOpen(false)} aria-hidden="true" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="筛选"
            tabIndex={-1}
            onKeyDown={trapDialogFocus}
            class="relative w-full bg-surface rounded-t-2xl max-h-[80vh] overflow-y-auto hide-scrollbar shadow-2xl outline-none"
          >
            <div class="sticky top-0 bg-surface rounded-t-2xl px-6 py-4 border-b border-outline-variant flex justify-between items-center z-10">
              <h3 class="text-title-md font-bold text-on-surface">筛选</h3>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                class="tap-target p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                aria-label="关闭筛选"
              >
                <span class="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
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
    </main>
  )
}
