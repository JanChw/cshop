import { createSignal, createMemo, For } from 'solid-js'
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

  const statusMap: Record<string, string> = {
    '待付款': 'pending',
    '待收货': 'shipping',
    '已完成': 'completed',
    '已取消': 'cancelled'
  }

  const filteredOrders = createMemo(() => {
    if (activeTab() === '全部') return props.orders
    return props.orders.filter((o) => statusMap[activeTab()] === o.status)
  })

  return (
    <main class="md:pt-16 min-h-screen pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8">
      <header class="fixed top-0 md:top-16 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div class="container-content flex justify-between items-center h-14">
          <div class="flex items-center gap-4">
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
              class="tap-target flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full p-2"
              aria-label="搜索订单"
            >
              <span class="material-symbols-outlined">search</span>
            </button>
            <div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-lg">person</span>
            </div>
          </div>
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
      </section>
    </main>
  )
}
