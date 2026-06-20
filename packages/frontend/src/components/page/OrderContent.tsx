import { createSignal, createMemo, For, Show } from 'solid-js'
import SearchInput from '../ui/SearchInput'
import OrderCard from '../ui/OrderCard'

interface OrderItem {
  product: { name: string; image: string }
  quantity: number
  size: string
  color: string
}

interface Order {
  orderNumber: string
  status: 'pending' | 'shipping' | 'completed' | 'cancelled'
  items: OrderItem[]
  total: number
  designer?: string
  createdAt: string
}

interface Props {
  orders: Order[]
}

const TABS = ['全部', '待付款', '待收货', '已完成', '已取消']

export default function OrderContent(props: Props) {
  const [activeTab, setActiveTab] = createSignal('全部')
  const [searchOpen, setSearchOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')

  const statusMap: Record<string, string> = {
    '待付款': 'pending',
    '待收货': 'shipping',
    '已完成': 'completed',
    '已取消': 'cancelled'
  }

  const filteredOrders = createMemo(() => {
    let result = props.orders

    if (activeTab() !== '全部') {
      result = result.filter((o) => statusMap[activeTab()] === o.status)
    }

    const q = query().trim().toLowerCase()
    if (q) {
      result = result.filter((o) => {
        const orderMatch = o.orderNumber.toLowerCase().includes(q)
        const itemMatch = o.items.some((item) =>
          item.product.name.toLowerCase().includes(q)
        )
        return orderMatch || itemMatch
      })
    }

    return result
  })

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface border-b border-outline-variant">
        <div class="container-content flex items-center justify-between h-16">
          <Show
            when={!searchOpen()}
            fallback={
              <>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery('') }}
                  class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full shrink-0"
                  aria-label="关闭搜索"
                >
                  <span class="material-symbols-outlined text-primary">arrow_back</span>
                </button>
                <SearchInput
                  value={query()}
                  onInput={setQuery}
                  onClear={() => setQuery('')}
                  placeholder="搜索订单号或商品名称"
                  size="sm"
                  autoFocus
                  class="flex-1 ml-2"
                />
              </>
            }
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => history.back()}
                class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full shrink-0"
                aria-label="返回"
              >
                <span class="material-symbols-outlined text-primary">arrow_back</span>
              </button>
              <h1 class="text-lg font-bold text-primary truncate">订单管理</h1>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
              aria-label="搜索订单"
            >
              <span class="material-symbols-outlined text-primary">search</span>
            </button>
          </Show>
        </div>
      </header>

      <nav class="sticky top-16 md:top-32 z-30 bg-surface border-b border-outline-variant">
        <div class="container-content flex items-center gap-6 md:gap-8 h-12 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              type="button"
              onClick={() => setActiveTab(tab)}
              class={`text-label-md h-full flex items-center px-1 whitespace-nowrap tap-target transition-colors ${
                activeTab() === tab
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-pressed={activeTab() === tab}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <section class="container-content py-stack-lg space-y-6">
        <Show
          when={filteredOrders().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span class="material-symbols-outlined text-5xl mb-4">search_off</span>
              <p class="text-body-lg">没有找到相关订单</p>
              {query() && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  class="mt-4 text-label-md text-primary hover:opacity-80 tap-target"
                >
                  清除搜索条件
                </button>
              )}
            </div>
          }
        >
          <For each={filteredOrders()}>
            {(order) => (
              <OrderCard
                orderNumber={order.orderNumber}
                status={order.status}
                items={order.items}
                total={order.total}
                designer={order.designer}
                createdAt={order.createdAt}
              />
            )}
          </For>
        </Show>
      </section>
    </div>
  )
}
