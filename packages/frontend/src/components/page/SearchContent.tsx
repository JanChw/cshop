import { createSignal, createMemo } from 'solid-js'
import SearchInput from '../ui/SearchInput'
import { showToast } from '../../lib/toast'

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

export default function SearchContent(props: Props) {
  const [query, setQuery] = createSignal('高级休闲服')
  const [activeChip, setActiveChip] = createSignal('全部')
  const chips = ['全部', '基础款', '精选必备', '限量系列', '配饰']

  const filteredProducts = createMemo(() => {
    let result = props.products
    const q = query().trim().toLowerCase()
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    const chip = activeChip()
    if (chip !== '全部') result = result.filter((p) => p.category.includes(chip.replace('基础款', '基础').replace('精选必备', '核心').replace('限量系列', '设计师')))
    return result
  })

  return (
    <div>
      <section class="px-6 pt-6">
        <div class="mb-6">
          <SearchInput placeholder="搜索连帽衫、T恤..." value={query()} onInput={setQuery} />
        </div>
        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {chips.map((chip) => (
            <button
              class={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-all ${
                activeChip() === chip
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-container-highest'
              }`}
              onClick={() => setActiveChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>
      <section class="px-6 py-4 flex justify-between items-center">
        <p class="text-on-surface-variant text-sm font-headline italic tracking-wide">为您找到 {filteredProducts().length} 个结果</p>
        <button class="flex items-center gap-2 text-primary font-medium text-sm"><span class="material-symbols-outlined text-lg">tune</span>筛选</button>
      </section>
      <section class="px-6 grid grid-cols-2 gap-x-4 gap-y-8">
        {filteredProducts().map((product) => (
          <div class="group cursor-pointer">
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container relative mb-4">
              <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image} alt={product.name} loading="lazy" />
              <div class="absolute top-3 right-3 w-10 h-10 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-on-surface hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); showToast('已加入购物车') }}>
                <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
              </div>
            </div>
            <h3 class="text-on-surface font-medium mb-1">{product.name}</h3>
            <p class="text-on-surface-variant text-xs mb-2">{product.description || product.category}</p>
            <div class="flex items-center justify-between">
              <span class="text-primary font-bold">¥{product.price}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
