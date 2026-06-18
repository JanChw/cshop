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
    <main class="md:pt-16 min-h-screen pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8">
      <header class="fixed top-0 md:top-16 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div class="container-content flex items-center h-14 gap-3">
          <Show
            when={!searchOpen()}
            fallback={
              <>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery('') }}
                  class="tap-target flex items-center justify-center text-on-surface hover:bg-surface-container rounded-full flex-shrink-0"
                  aria-label="关闭搜索"
                >
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <SearchInput
                  value={query()}
                  onInput={setQuery}
                  onClear={() => setQuery('')}
                  placeholder="搜索订单号或商品名称"
                  size="sm"
                  autoFocus
                  class="flex-1"
                />
              </>
            }
          >
            <div class="flex items-center gap-4 flex-1">
              <button
                type="button"
                onClick={() => history.back()}
                class="md:hidden tap-target flex items-center justify-center text-on-surface hover:bg-surface-container rounded-full"
                aria-label="返回"
              >
                <span class="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 class="text-title-md md:text-headline-lg-mobile font-bold text-on-surface">订单管理</h1>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                class="tap-target flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full p-2"
                aria-label="搜索订单"
              >
                <span class="material-symbols-outlined">search</span>
              </button>
              <div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-lg">person</span>
              </div>
            </div>
          </Show>
        </div>
      </header>

      <nav class="sticky top-14 z-30 bg-surface border-b border-outline-variant">
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

      <section class="container-content py-stack-lg space-y-6 pt-28 md:pt-8">
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
    </main>
  )
}
