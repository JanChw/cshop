import { createSignal } from 'solid-js'
import { showToast } from '../../lib/toast'
import SearchInput from '../ui/SearchInput'

export default function HelpCenter () {
  const [searchQuery, setSearchQuery] = createSignal('')

  const faqs = [
    { q: '我的订单什么时候发货？', a: '标准订单通常在3-5个工作日内发货。定制产品由于需要手工制作，预计在7-10个工作日内完成并寄出。发货后您将收到包含物流追踪号的确认邮件。' },
    { q: '如何申请退货？', a: '您可以在签收后15天内申请退货。请通过"我的订单"页面选择对应商品，并点击"申请售后"。非质量问题的退货，邮费需由客户承担。' },
    { q: '支持哪些支付方式？', a: '我们目前支持微信支付、支付宝、银联支付以及各大主流信用卡的在线支付，确保您的交易安全便捷。' }
  ]

  const categories = [
    { icon: 'package_2', title: '订单问题', desc: '追踪物流、修改地址或取消订单的相关指南。', color: 'primary' },
    { icon: 'palette', title: '定制指南', desc: '了解如何选择材质、颜色及个性化刻字服务。', color: 'tertiary' },
    { icon: 'local_shipping', title: '配送与退换', desc: '关于全球配送时效、费用及无忧退货流程。', color: 'secondary' }
  ]

  return (
    <div class='bg-background min-h-screen pb-24 text-on-surface md:pt-16'>
      <header class='sticky top-0 md:top-16 z-50 bg-surface h-16 flex justify-between items-center px-4 border-b border-outline-variant'>
        <div class='flex items-center gap-4'>
          <a
            href='/person'
            class='tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full'
            aria-label='返回'
          >
            <span class='material-symbols-outlined text-primary'>arrow_back</span>
          </a>
          <h1 class='text-lg font-bold text-primary'>帮助中心</h1>
        </div>
        <button
          type='button'
          onClick={() => showToast('暂无新消息')}
          class='tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full'
          aria-label='通知'
        >
          <span class='material-symbols-outlined text-primary'>notifications</span>
        </button>
      </header>

      <main class='container-content py-8 pb-24'>
        <section class='mb-12 text-center md:text-left'>
          <h2 class='text-3xl md:text-4xl font-headline mb-4 tracking-tight'>我们能为您提供什么帮助？</h2>
          <p class='text-on-surface-variant font-body mb-8'>在这里搜索常见问题或浏览下方类别</p>
          <div class='max-w-2xl mx-auto md:mx-0'>
            <SearchInput placeholder='搜索关键词，如"定制"、"退货政策"...' value={searchQuery()} onInput={setSearchQuery} />
          </div>
        </section>

        <section class='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
          {categories.map((cat) => (
            <button
              type='button'
              onClick={() => showToast(`${cat.title}详情即将上线`)}
              class='bg-surface-container-low p-6 md:p-8 rounded-xl border border-outline-variant/40 hover:border-outline hover:-translate-y-0.5 transition-colors transition-transform duration-200 cursor-pointer text-left tap-target'
            >
              <div class={`w-12 h-12 bg-${cat.color}/10 rounded-lg flex items-center justify-center mb-6`}>
                <span class={`material-symbols-outlined text-${cat.color}`}>{cat.icon}</span>
              </div>
              <h3 class='text-xl font-headline font-semibold mb-2'>{cat.title}</h3>
              <p class='text-sm text-on-surface-variant'>{cat.desc}</p>
            </button>
          ))}
        </section>

        <div class='md:flex md:gap-8'>
          <section class='mb-12 md:w-1/2'>
            <h2 class='text-2xl font-headline mb-6 border-b border-outline-variant pb-2'>热门问题</h2>
            <div class='space-y-4'>
              {faqs.map((faq) => (
                <details class='group bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden'>
                  <summary class='flex justify-between items-center p-5 cursor-pointer list-none tap-target'>
                    <span class='font-body font-medium'>{faq.q}</span>
                    <span class='material-symbols-outlined transition-transform group-open:rotate-180'>expand_more</span>
                  </summary>
                  <div class='px-5 pb-5 text-on-surface-variant text-sm leading-relaxed'>{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <section class='bg-primary text-on-primary rounded-2xl p-8 md:p-8 flex flex-col items-center justify-between gap-8 overflow-hidden relative md:w-1/2'>
            <div class='relative z-10 text-center md:text-left'>
              <h2 class='text-2xl md:text-3xl font-headline mb-2'>仍需进一步帮助？</h2>
              <p class='text-on-primary/80 max-w-md'>我们的客服专家全天候在线，随时为您解答疑问并提供个性化建议。</p>
            </div>
            <button
              type='button'
              onClick={() => showToast('正在连接在线客服...')}
              class='relative z-10 px-8 py-4 bg-surface text-primary font-bold rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 tap-target shrink-0'
            >
              <span class='material-symbols-outlined'>support_agent</span>联系在线客服
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
