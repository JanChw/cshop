import { createSignal, createMemo, For } from 'solid-js'
import SearchInput from '../ui/SearchInput'
import ProductCard from '../ui/ProductCard'

interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  description?: string
}

interface Props {
  products: Product[]
}

const CHIPS = ['全部', '基础款', '精选必备', '限量系列', '配饰']

export default function SearchContent(props: Props) {
  const [query, setQuery] = createSignal('')
  const [activeChip, setActiveChip] = createSignal('全部')

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
      const mapped = chip.replace('基础款', '基础').replace('精选必备', '核心').replace('限量系列', '设计师')
      result = result.filter((p) => p.category.includes(mapped))
    }
    return result
  })

  return (
    <main class="md:pt-20 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8 min-h-screen container-content">
      <section class="pt-6 md:pt-8">
        <div class="mb-6 md:max-w-xl md:mx-auto">
          <SearchInput placeholder="搜索连帽衫、T恤..." value={query()} onInput={setQuery} />
        </div>
        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2 md:justify-center">
          <For each={CHIPS}>
            {(chip) => (
              <button
                type="button"
                onClick={() => setActiveChip(chip)}
                class={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-all tap-target ${
                  activeChip() === chip
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-container-highest'
                }`}
                aria-pressed={activeChip() === chip}
              >
                {chip}
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="py-4 flex justify-between items-center">
        <p class="text-on-surface-variant text-sm">为您找到 {filteredProducts().length} 个结果</p>
        <button
          type="button"
          class="flex items-center gap-2 text-primary font-medium text-sm tap-target"
          aria-label="筛选"
        >
          <span class="material-symbols-outlined text-lg">tune</span>筛选
        </button>
      </section>

      <section class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
        <For each={filteredProducts()}>
          {(product) => (
            <ProductCard
              product={{
                ...product,
                tags: undefined
              }}
              variant="search"
            />
          )}
        </For>
      </section>
    </main>
  )
}
