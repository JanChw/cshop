import { createSignal, onMount } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'
import { mockOrders } from '../../lib/mock'
import type { Order } from '../../lib/types'

interface TimelineNode {
  title: string
  desc: string
  time: string
  active: boolean
}

function buildTimeline(order: Order): TimelineNode[] {
  const now = new Date()
  const shipDate = new Date(now)
  shipDate.setDate(shipDate.getDate() - 2)

  const nodes: TimelineNode[] = [
    {
      title: '包裹已发货',
      desc: '商家已完成包裹打包并交给快递公司',
      time: formatTime(shipDate),
      active: false
    }
  ]

  if (order.status === 'shipping') {
    const arrived = new Date(shipDate)
    arrived.setDate(arrived.getDate() + 1)
    arrived.setHours(14, 30, 0)
    nodes.push({
      title: `快件离开 【${order.carrier || '快递'}分拣中心】, 正在运输中`,
      desc: '',
      time: formatTime(arrived),
      active: false
    })

    const delivering = new Date(arrived)
    delivering.setDate(delivering.getDate() + 1)
    delivering.setHours(9, 15, 0)
    nodes.push({
      title: '包裹正在派送中',
      desc: '派送员正在为您派送，请保持手机畅通',
      time: formatTime(delivering),
      active: true
    })
  } else if (order.status === 'completed') {
    const transit = new Date(shipDate)
    transit.setDate(transit.getDate() + 1)
    transit.setHours(14, 30, 0)
    nodes.push({
      title: `快件离开 【${order.carrier || '快递'}分拣中心】, 正在运输中`,
      desc: '',
      time: formatTime(transit),
      active: false
    })

    const delivering = new Date(transit)
    delivering.setDate(delivering.getDate() + 1)
    delivering.setHours(9, 15, 0)
    nodes.push({
      title: '包裹正在派送中',
      desc: '派送员正在为您派送',
      time: formatTime(delivering),
      active: false
    })

    const delivered = new Date(delivering)
    delivered.setHours(14, 20, 0)
    nodes.push({
      title: '已签收',
      desc: '本人签收，感谢使用' + (order.carrier || '快递'),
      time: formatTime(delivered),
      active: true
    })
  }

  return nodes.reverse()
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function LogisticsContent() {
  const [confirming, setConfirming] = createSignal(false)
  const [confirmed, setConfirmed] = createSignal(false)
  const [order, setOrder] = createSignal<Order | null>(null)
  const [timeline, setTimeline] = createSignal<TimelineNode[]>([])

  onMount(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    const found = mockOrders.find(o => o.orderNumber === id || o.id === id)
    if (found) {
      setOrder(found)
      setTimeline(buildTimeline(found))
    }
  })

  const handleConfirm = () => {
    if (!confirm('确认已收到商品？确认后订单将标记为已完成。')) return
    setConfirming(true)
    setTimeout(() => {
      setConfirming(false)
      setConfirmed(true)
      showToast('已确认收货，感谢您的购买！')
    }, 1200)
  }

  const statusLabel = () => {
    const o = order()
    if (!o) return '--'
    if (o.status === 'shipping') return '运输中'
    if (o.status === 'completed') return '已签收'
    return '待发货'
  }

  const statusIcon = () => {
    const o = order()
    if (!o) return 'local_shipping'
    if (o.status === 'completed') return 'check_circle'
    return 'local_shipping'
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface border-b border-outline-variant">
        <div class="container-content flex justify-between items-center h-16">
          <button
            type="button"
            onClick={() => history.back()}
            class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
            aria-label="返回"
          >
            <span class="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 class="text-lg font-bold text-primary">物流详情</h1>
          <button
            type="button"
            onClick={() => showToast('暂无新消息')}
            class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
            aria-label="通知"
          >
            <span class="material-symbols-outlined text-primary">notifications</span>
          </button>
        </div>
      </header>

      <div class="container-content pt-4 pb-8 md:flex md:gap-8">
        <div class="md:w-2/5 space-y-6">
          <section class="bg-surface rounded-xl p-6 md:p-8 shadow-card border border-outline-variant/60">
            <div class="flex items-start justify-between mb-6">
              <div class="space-y-1">
                <p class="text-on-surface-variant text-sm">当前状态</p>
                <h2 class="text-3xl font-headline text-primary font-bold">{statusLabel()}</h2>
              </div>
              <div class="w-16 h-16 bg-primary-container/20 flex items-center justify-center rounded-full">
                <span class="material-symbols-outlined text-primary text-3xl">{statusIcon()}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant/40">
              <div>
                <p class="text-on-surface-variant text-xs mb-1">订单编号</p>
                <p class="font-medium text-on-surface">{order()?.orderNumber || '--'}</p>
              </div>
              <div>
                <p class="text-on-surface-variant text-xs mb-1">承运公司</p>
                <p class="font-medium text-on-surface">{order()?.carrier || '--'}</p>
              </div>
              {order()?.trackingNumber && (
                <div class="col-span-2">
                  <p class="text-on-surface-variant text-xs mb-1">快递单号</p>
                  <p class="font-medium text-on-surface">{order()!.trackingNumber}</p>
                </div>
              )}
            </div>
          </section>

          {order()?.items[0] && (
            <section class="bg-surface-container-low rounded-xl p-4 md:p-6 flex gap-4 items-center border border-outline-variant/40">
              <div class="w-20 h-20 flex-shrink-0">
                <ProductImage
                  src={order()!.items[0].product.image}
                  alt={order()!.items[0].product.name}
                  aspect="aspect-square"
                  rounded="rounded-lg"
                  fallbackLabel={order()!.items[0].product.name}
                  class="w-full h-full"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-headline text-xl text-on-surface leading-tight truncate">{order()!.items[0].product.name}</h3>
                <p class="text-on-surface-variant text-sm mt-1">尺码: {order()!.items[0].size} | 颜色: {order()!.items[0].color}</p>
                <div class="mt-2 text-primary font-bold">¥{order()!.total.toFixed(2)}</div>
              </div>
            </section>
          )}

          {order()?.status === 'shipping' && (
            <div class="flex gap-4">
              <button
                type="button"
                onClick={() => showToast('正在连接在线客服...')}
                class="flex-1 py-4 px-6 rounded-lg border border-outline text-on-surface-variant font-medium hover:bg-primary/10 hover:text-primary transition-colors transition-transform active:scale-95 tap-target"
              >
                联系客服
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmed() || confirming()}
                class={`flex-1 py-4 px-6 rounded-lg font-medium transition-opacity transition-transform active:scale-95 tap-target disabled:opacity-60 ${
                  confirmed() ? 'bg-success text-on-success' : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {confirming() ? (
                  <span class="material-symbols-outlined animate-spin inline-block">progress_activity</span>
                ) : confirmed() ? (
                  <><span class="material-symbols-outlined inline-block">check_circle</span> 已确认</>
                ) : (
                  '确认收货'
                )}
              </button>
            </div>
          )}
        </div>

        <section class="md:w-3/5 bg-surface rounded-xl p-6 md:p-8 shadow-card border border-outline-variant/60 mt-6 md:mt-0">
          <h3 class="font-headline text-2xl mb-8 border-b border-outline-variant/40 pb-4">实时物流轨迹</h3>
          {timeline().length > 0 ? (
            <div class="space-y-8">
              {timeline().map((node, index) => (
                <div class="relative flex gap-6">
                  <div class="relative z-10 flex flex-col items-center">
                    <div class={`w-4 h-4 rounded-full ${node.active ? 'bg-accent ring-4 ring-accent-container/30' : 'bg-outline'}`} />
                    {index < timeline().length - 1 && (
                      <div class="absolute top-4 left-[7px] bottom-[-24px] w-px bg-outline-variant" />
                    )}
                  </div>
                  <div class="pb-2" style={{ opacity: node.active ? 1 : 1 - index * 0.2 }}>
                    <p class={`leading-snug ${node.active ? 'text-on-surface font-semibold' : 'text-on-surface font-medium'}`}>
                      {node.title}
                    </p>
                    {node.desc && <p class="text-on-surface-variant text-sm mt-1">{node.desc}</p>}
                    <p class="text-on-surface-variant text-xs mt-2">{node.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div class="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <span class="material-symbols-outlined text-5xl mb-4">inventory_2</span>
              <p class="text-body-lg">暂无物流信息</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
