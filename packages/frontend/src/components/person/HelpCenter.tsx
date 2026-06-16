import { createSignal } from 'solid-js'
import { showToast } from '../../lib/toast'
import SearchInput from '../ui/SearchInput'

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = createSignal('')

  const faqs = [
    { q: '我的订单什么时候发货？', a: '标准订单通常在3-5个工作日内发货。定制产品由于需要手工制作，预计在7-10个工作日内完成并寄出。发货后您将收到包含物流追踪号的确认邮件。' },
    { q: '如何申请退货？', a: '您可以在签收后15天内申请退货。请通过"我的订单"页面选择对应商品，并点击"申请售后"。非质量问题的退货，邮费需由客户承担。' },
    { q: '支持哪些支付方式？', a: '我们目前支持微信支付、支付宝、银联支付以及各大主流信用卡的在线支付，确保您的交易安全便捷。' },
  ]

  const categories = [
    { icon: 'package_2', title: '订单问题', desc: '追踪物流、修改地址或取消订单的相关指南。', color: 'primary' },
    { icon: 'palette', title: '定制指南', desc: '了解如何选择材质、颜色及个性化刻字服务。', color: 'tertiary' },
    { icon: 'local_shipping', title: '配送与退换', desc: '关于全球配送时效、费用及无忧退货流程。', color: 'secondary' },
  ]

  return (
    <div>
      <header class="bg-surface sticky top-0 z-40 border-b border-outline-variant/60 flex justify-between items-center px-6 h-16 w-full">
        <div class="flex items-center gap-4">
          <button onclick={() => history.back()} class="p-2 hover:bg-surface-container-high transition-colors rounded-full">
            <span class="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h1 class="font-headline text-2xl font-bold text-primary">帮助中心</h1>
        </div>
        <button onclick={() => showToast('暂无新消息')} class="p-2 hover:bg-surface-container-high transition-colors rounded-full">
          <span class="material-symbols-outlined text-on-surface">notifications</span>
        </button>
      </header>

      <main class=" px-6 py-8 pb-24">
        <section class="mb-12 text-center">
          <h2 class="text-4xl font-headline mb-4 tracking-tight">我们能为您提供什么帮助？</h2>
          <p class="text-on-surface-variant font-body mb-8">在这里搜索常见问题或浏览下方类别</p>
          <div class="max-w-2xl mx-auto">
            <SearchInput placeholder='搜索关键词，如"定制"、"退货政策"...' value={searchQuery()} onInput={setSearchQuery} class="shadow-card" />
          </div>
        </section>

        <section class="grid grid-cols-1 gap-6 mb-12">
          {categories.map((cat) => (
            <div class="bg-surface-container-low p-8 rounded-xl border border-outline-variant/40 hover:shadow-card transition-all cursor-pointer"
              onMouseDown={() => {}} onMouseUp={() => {}}>
              <div class={`w-12 h-12 bg-${cat.color}/10 rounded-lg flex items-center justify-center mb-6`}>
                <span class={`material-symbols-outlined text-${cat.color}`}>{cat.icon}</span>
              </div>
              <h3 class="text-xl font-headline font-semibold mb-2">{cat.title}</h3>
              <p class="text-sm text-on-surface-variant font-body">{cat.desc}</p>
            </div>
          ))}
        </section>

        <section class="mb-12">
          <h2 class="text-2xl font-headline mb-6 border-b border-outline-variant pb-2">热门问题</h2>
          <div class="space-y-4">
            {faqs.map((faq) => (
              <details class="group bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden">
                <summary class="flex justify-between items-center p-5 cursor-pointer list-none">
                  <span class="font-body font-medium">{faq.q}</span>
                  <span class="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div class="px-5 pb-5 text-on-surface-variant text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section class="bg-primary text-on-primary rounded-2xl p-10 flex flex-col items-center justify-between gap-8 overflow-hidden relative">
          <div class="absolute top-0 right-0 w-64 h-64 bg-primary-container opacity-20 rounded-full -mr-20 -mt-20"></div>
          <div class="relative z-10 text-center">
            <h2 class="text-3xl font-headline mb-2">仍需进一步帮助？</h2>
            <p class="text-on-primary/80 font-body max-w-md">我们的客服专家全天候在线，随时为您解答疑问并提供个性化建议。</p>
          </div>
          <button onclick={() => showToast('正在连接在线客服...')}
            class="relative z-10 px-8 py-4 bg-surface text-primary font-bold rounded-lg hover:bg-surface-container-high transition-all active:scale-95 shadow-lg flex items-center gap-2">
            <span class="material-symbols-outlined">support_agent</span>联系在线客服
          </button>
        </section>
      </main>
    </div>
  )
}
