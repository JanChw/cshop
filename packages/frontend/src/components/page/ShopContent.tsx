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
      if (zh) {
        const chips = document.querySelectorAll('#shop-category-chips button')
        chips.forEach((c) => {
          if (c.textContent?.includes(zh)) {
            ;(c as HTMLButtonElement).click()
          }
        })
        setActiveCategory(cat)
      }
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
    <div>
      <section class="px-container-margin pt-stack-lg pb-stack-md">
        <div class="flex flex-col gap-stack-md">
          <h1 class="text-headline-lg-mobile text-on-surface">探索精品</h1>
          <div id="shop-category-chips">
            <CategoryChips
              items={[
                { zh: '全部' },
                { zh: '基础系列', en: 'Basics' },
                { zh: '核心系列', en: 'Essentials' },
                { zh: '设计师款', en: 'Designer' },
                { zh: '定制款', en: 'Custom' }
              ]}
              onChange={handleCategoryChange}
            />
          </div>
        </div>
      </section>
      <section class="px-container-margin py-stack-md flex items-center justify-between border-y border-outline-variant/30 sticky top-12 bg-background z-40 no-scrollbar">
        <div class="flex gap-stack-md overflow-x-auto py-1" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
          <div class="flex items-center gap-1 border border-primary text-primary rounded-lg px-3 py-1.5 whitespace-nowrap bg-surface"><span class="text-label-md">面料: 棉质</span><span class="material-symbols-outlined text-[16px]">keyboard_arrow_down</span></div>
          <div class="flex items-center gap-1 border border-outline rounded-lg px-3 py-1.5 whitespace-nowrap bg-surface"><span class="text-label-md">版型: 宽松</span><span class="material-symbols-outlined text-[16px]">keyboard_arrow_down</span></div>
          <div class="flex items-center gap-1 border border-outline rounded-lg px-3 py-1.5 whitespace-nowrap bg-surface"><span class="text-label-md">价格: ¥200+</span><span class="material-symbols-outlined text-[16px]">keyboard_arrow_down</span></div>
        </div>
        <button class="ml-4 flex items-center gap-2 text-primary text-label-md shrink-0"><span class="material-symbols-outlined">tune</span><span class="inline">筛选</span></button>
      </section>
      <section class="px-container-margin py-stack-lg grid grid-cols-2 gap-gutter">
        {filteredProducts().map((product) => (
          <ProductCard product={product} variant="shop" />
        ))}
      </section>
    </div>
  )
}
