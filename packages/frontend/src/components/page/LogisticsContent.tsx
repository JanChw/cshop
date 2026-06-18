import { createSignal } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'

const TIMELINE = [
  {
    title: '包裹正在派送中',
    desc: '上海市静安区派送员 王师傅 (138****0000) 正在为您派送',
    time: '2023-11-24 09:15:32',
    active: true
  },
  {
    title: '快件到达 【上海静安区共和新路营业点】',
    desc: '包裹已到达目的地分拣中心，准备派送',
    time: '2023-11-24 02:10:45',
    active: false
  },
  {
    title: '快件离开 【杭州萧山集散中心】, 正发往 【上海静安集散中心】',
    desc: '',
    time: '2023-11-23 21:45:10',
    active: false
  },
  {
    title: '包裹已发货',
    desc: '商家已完成包裹打包并交给快递公司',
    time: '2023-11-23 14:20:00',
    active: false
  }
]

export default function LogisticsContent() {
  const [confirming, setConfirming] = createSignal(false)
  const [confirmed, setConfirmed] = createSignal(false)

  const handleConfirm = () => {
    if (!confirm('确认已收到商品？确认后订单将标记为已完成。')) return
    setConfirming(true)
    setTimeout(() => {
      setConfirming(false)
      setConfirmed(true)
      showToast('已确认收货，感谢您的购买！')
    }, 1200)
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface border-b border-outline-variant">
        <div class="container-content flex justify-between items-center h-16">
          <button
            type="button"
            onClick={() => history.back()}
            class="tap-target p-2 hover:bg-surface-container-high rounded-full transition-colors"
            aria-label="返回"
          >
            <span class="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 class="text-lg font-bold text-primary">物流详情</h1>
          <button
            type="button"
            onClick={() => showToast('暂无新消息')}
            class="tap-target p-2 hover:bg-surface-container-high rounded-full transition-colors"
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
                <h2 class="text-3xl font-headline text-primary font-bold">运输中</h2>
              </div>
              <div class="w-16 h-16 bg-primary-container/20 flex items-center justify-center rounded-full">
                <span class="material-symbols-outlined text-primary text-3xl">local_shipping</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant/40">
              <div>
                <p class="text-on-surface-variant text-xs mb-1">订单编号</p>
                <p class="font-medium text-on-surface">BCW-882931024</p>
              </div>
              <div>
                <p class="text-on-surface-variant text-xs mb-1">承运公司</p>
                <p class="font-medium text-on-surface">顺丰速运 (SF Express)</p>
              </div>
            </div>
          </section>

          <section class="bg-surface-container-low rounded-xl p-4 md:p-6 flex gap-4 items-center border border-outline-variant/40">
            <div class="w-20 h-20 flex-shrink-0">
              <ProductImage
                src="https://picsum.photos/seed/5cc3929fc58a/400/500"
                alt="产品图"
                aspect="aspect-square"
                rounded="rounded-lg"
                fallbackLabel="产品图"
                class="w-full h-full"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-headline text-xl text-on-surface leading-tight truncate">手工亚麻束腰外套</h3>
              <p class="text-on-surface-variant text-sm mt-1">尺码: M | 颜色: 拿铁色</p>
              <div class="mt-2 text-primary font-bold">¥1,280.00</div>
            </div>
          </section>

          <div class="flex gap-4">
            <button
              type="button"
              onClick={() => showToast('正在连接在线客服...')}
              class="flex-1 py-4 px-6 rounded-lg border border-outline text-on-surface-variant font-medium hover:bg-surface-container transition-colors active:scale-95 tap-target"
            >
              联系客服
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmed() || confirming()}
              class={`flex-1 py-4 px-6 rounded-lg font-medium transition-all active:scale-95 tap-target disabled:opacity-60 ${
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
        </div>

        <section class="md:w-3/5 bg-surface rounded-xl p-6 md:p-8 shadow-card border border-outline-variant/60 mt-6 md:mt-0">
          <h3 class="font-headline text-2xl mb-8 border-b border-outline-variant/40 pb-4">实时物流轨迹</h3>
          <div class="space-y-8">
            {TIMELINE.map((node, index) => (
              <div class="relative flex gap-6">
                <div class="relative z-10 flex flex-col items-center">
                  <div class={`w-4 h-4 rounded-full ${node.active ? 'bg-primary ring-4 ring-primary-container/30' : 'bg-outline'}`} />
                  {index < TIMELINE.length - 1 && (
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
        </section>
      </div>
    </div>
  )
}
