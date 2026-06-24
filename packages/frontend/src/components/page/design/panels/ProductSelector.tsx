import { createResource, For, Show } from 'solid-js'
import { api } from '../../../../lib/api'

interface ProductItem {
  id: number
  name: string
  basePrice: number
  image: string | null
  description: string | null
}

interface Props {
  selectedProductId: number | null
  onSelect: (product: ProductItem) => void
}

export default function ProductSelector(props: Props) {
  const [products] = createResource(async () => {
    const catsRes = await api.categories.list()
    const base = catsRes?.data?.items?.find((c: any) => c.slug === 'basics')
    if (!base) return { data: { items: [] } }
    return api.products.list({ categoryId: base.id, limit: 50 })
  })

  return (
    <section class="mt-6 mb-12">
      <Show
        when={!products.loading}
        fallback={
          <div class="flex justify-center py-8">
            <span class="text-secondary text-body-sm">加载中...</span>
          </div>
        }
      >
        <div class="space-y-4">
          <For each={products()?.data?.items ?? []}>
            {(item: ProductItem) => {
              const isSelected = () => props.selectedProductId === item.id
              const imgUrl = item.image || '/tshirt.png'
              return (
                <button
                  type="button"
                  class={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected()
                      ? 'bg-primary-container/20 border-primary'
                      : 'bg-surface-container-low border-outline-variant hover:border-primary/50'
                  }`}
                  onClick={() => props.onSelect(item)}
                  aria-label={`选择 ${item.name}`}
                >
                  <div class="flex items-center gap-4">
                    <div class="w-20 h-20 rounded-lg overflow-hidden bg-surface shrink-0 flex items-center justify-center border border-outline-variant">
                      <img
                        src={imgUrl}
                        alt={item.name}
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-body-sm font-bold text-on-surface truncate">
                        {item.name}
                      </p>
                      <Show when={item.description}>
                        <p class="text-xs text-secondary mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </Show>
                      <p class="text-label-md font-bold text-primary mt-1">
                        ¥{item.basePrice.toFixed(2)}
                      </p>
                    </div>
                    <Show when={isSelected()}>
                      <span class="material-symbols-outlined text-primary shrink-0">
                        check_circle
                      </span>
                    </Show>
                  </div>
                </button>
              )
            }}
          </For>
        </div>
      </Show>
    </section>
  )
}
